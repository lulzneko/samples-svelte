import type { Serverless } from 'serverless/aws';
import { name } from './package.json';

module.exports = ((): Serverless => ({

  service: name,

  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
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
      }
    }
  }
}))();
