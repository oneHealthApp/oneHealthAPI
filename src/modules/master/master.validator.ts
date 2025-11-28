import Joi from 'joi';
import { MASTER_DATA_REGISTRY } from './master.data';

const validMasterDataKeys = Object.keys(MASTER_DATA_REGISTRY);

export class MasterValidator {
  static getMasterData = Joi.object({
    collection: Joi.string()
      .valid(...validMasterDataKeys)
      .required()
      .messages({
        'string.base': 'Collection must be a string',
        'any.only': `Collection must be one of: ${validMasterDataKeys.join(', ')}`,
        'any.required': 'Collection is required'
      })
  });

  static searchMasterData = Joi.object({
    collection: Joi.string()
      .valid(...validMasterDataKeys)
      .required()
      .messages({
        'string.base': 'Collection must be a string',
        'any.only': `Collection must be one of: ${validMasterDataKeys.join(', ')}`,
        'any.required': 'Collection is required'
      }),
    q: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.base': 'Search term must be a string',
        'string.min': 'Search term must be at least 1 character long',
        'string.max': 'Search term must not exceed 100 characters',
        'any.required': 'Search term is required'
      })
  });
}