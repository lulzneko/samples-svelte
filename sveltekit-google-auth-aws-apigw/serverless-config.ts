import type { Serverless } from 'serverless/aws';
import { name } from './package.json';

module.exports = ((): Serverless => ({

  service: name,

  provider: {
    name: 'aws',
  }
}))();
