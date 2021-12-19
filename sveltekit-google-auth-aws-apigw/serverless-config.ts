import type { Serverless } from 'serverless/aws';
import { name } from './package.json';

module.exports = ((): Serverless => ({

  service: name,

  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
  },

  plugins: [
    'serverless-s3-deploy'
  ],

  custom: {
    assets: {
      auto: true,
      targets: [{
        bucket: { Ref: 'SvelteKitStaticContentsBucket' },
        empty: true,
        files: [{
          source: 'build',
          globs: '**'
        }]
      }]
    }
  },

  package: {
    individually: true,
    patterns: [
      '!**',
      '.aws-apigw/**'
    ]
  },

  functions: {
    sveltekit: {
      handler: '.aws-apigw/functions-internal/__render.handler',
      events: [
        { httpApi: { method: '*', path: '*' }}
      ]
    }
  },

  resources: {
    Resources: {
      SvelteKitStaticContentsBucket: {
        Type: 'AWS::S3::Bucket', Properties: {}
      },

      SvelteKitStaticContentsBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: { Ref: 'SvelteKitStaticContentsBucket' },
          PolicyDocument: {
            Statement: [{
              Effect: 'Allow',
              Action: [ 's3:GetObject' ],
              Resource: { 'Fn::Join': [ '/', [{ 'Fn::GetAtt': [ 'SvelteKitStaticContentsBucket', 'Arn' ]}, '*' ]]},
              Principal: {
                CanonicalUser: { 'Fn::GetAtt': [ 'SvelteKitCloudFrontOriginAccessIdentity', 'S3CanonicalUserId' ]}
              }
            }]
          }
        }
      },

      SvelteKitCloudFrontOriginAccessIdentity: {
        Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        Properties: {
          CloudFrontOriginAccessIdentityConfig: { Comment: name }
        }
      },

      SvelteKitSsrApiGatewayOriginRequestPolicy: {
        Type: "AWS::CloudFront::OriginRequestPolicy",
        Properties: {
          OriginRequestPolicyConfig: {
            Name: 'SvelteKitSsrApiGatewayOriginRequestPolicy',
            HeadersConfig: { HeaderBehavior : 'none' },
            QueryStringsConfig: { QueryStringBehavior: 'all' },
            CookiesConfig: { CookieBehavior: 'all' }
          }
        }
      },

      SvelteKitDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Comment: name,
            Enabled: true,
            HttpVersion: 'http2',
            PriceClass: 'PriceClass_200',
            DefaultCacheBehavior: {
              TargetOriginId: 'SvelteKitSsrApiGatewayOrigin',
              Compress: true,
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: [ 'GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE' ],
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingDisabled
              OriginRequestPolicyId: { Ref: 'SvelteKitSsrApiGatewayOriginRequestPolicy' }
            },
            CacheBehaviors: [
              {
                TargetOriginId: 'SvelteKitStaticContentsBucketOrigin',
                PathPattern: '/_app/*',
                Compress: true,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: [ 'GET', 'HEAD' ],
                CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6' // Managed-CachingOptimized
              }
            ],
            Origins: [
              {
                Id: 'SvelteKitSsrApiGatewayOrigin',
                DomainName: { "Fn::Join": [ ".", [{ Ref: 'HttpApi' }, 'execute-api', { Ref: 'AWS::Region' }, { Ref: 'AWS::URLSuffix' }]]},
                CustomOriginConfig: {
                  OriginProtocolPolicy: 'https-only'
                }
              },
              {
                Id: 'SvelteKitStaticContentsBucketOrigin',
                DomainName: { 'Fn::GetAtt': [ 'SvelteKitStaticContentsBucket', 'DomainName' ]},
                S3OriginConfig: {
                  OriginAccessIdentity: { 'Fn::Join': [ '/', [ 'origin-access-identity/cloudfront', { Ref: 'SvelteKitCloudFrontOriginAccessIdentity' }]]}
                }
              }
            ]
          }
        }
      }
    }
  }
}))();
