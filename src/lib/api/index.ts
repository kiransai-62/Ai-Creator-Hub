import * as auth from './auth';
import * as categories from './categories';
import * as apiKeys from './apiKeys';
import * as analytics from './analytics';
import * as prompts from './prompts';
import { getOptimizedImageUrl } from './utils';

export * from './types';
export { getOptimizedImageUrl } from './utils';

export const api = {
  ...auth,
  ...categories,
  ...apiKeys,
  ...analytics,
  ...prompts,
  getOptimizedImageUrl
};
