import { MASTER_DATA_REGISTRY, MasterDataKey } from './master.data';
import { MasterDataResponse, MasterDataListResponse } from './master.type';
import { getModuleLogger } from '../../utils';

const logger = getModuleLogger('master-service');

export class MasterService {
  /**
   * Get master data by collection name
   * @param collection - Name of the master data collection
   * @returns Master data collection
   */
  static async getMasterData(collection: MasterDataKey): Promise<MasterDataResponse> {
    try {
      const data = MASTER_DATA_REGISTRY[collection];
      
      if (!data) {
        throw new Error(`Master data collection '${collection}' not found`);
      }

      logger.info(`Master data retrieved: ${collection}`);
      
      return {
        success: true,
        message: `${collection} master data retrieved successfully`,
        data: {
          collection,
          items: data,
          count: Array.isArray(data) ? data.length : Object.keys(data).length
        }
      };
    } catch (error) {
      logger.error('Error getting master data:', error);
      throw new Error('Failed to retrieve master data');
    }
  }

  /**
   * Get list of all available master data collections
   * @returns List of available collections
   */
  static async getAvailableCollections(): Promise<MasterDataListResponse> {
    try {
      const collections = Object.keys(MASTER_DATA_REGISTRY);

      logger.info('Available collections retrieved');
      
      return {
        success: true,
        message: 'Available master data collections retrieved successfully',
        data: {
          collections,
          count: collections.length
        }
      };
    } catch (error) {
      logger.error('Error getting available collections:', error);
      throw new Error('Failed to retrieve available collections');
    }
  }

  /**
   * Search within a specific master data collection
   * @param collection - Collection to search in
   * @param searchTerm - Term to search for
   * @returns Filtered results
   */
  static async searchMasterData(collection: MasterDataKey, searchTerm: string): Promise<MasterDataResponse> {
    try {
      const data = MASTER_DATA_REGISTRY[collection];
      
      if (!data || !Array.isArray(data)) {
        throw new Error(`Master data collection '${collection}' not found or not searchable`);
      }

      const searchTermLower = searchTerm.toLowerCase();
      
      const filteredData = data.filter((item: any) => 
        item.label?.toLowerCase().includes(searchTermLower) ||
        item.value?.toLowerCase().includes(searchTermLower) ||
        item.diseaseType?.toLowerCase().includes(searchTermLower) ||
        item.icdCode?.toLowerCase().includes(searchTermLower) ||
        (item.metadata?.commonSymptoms && 
          item.metadata.commonSymptoms.some((symptom: string) => 
            symptom.toLowerCase().includes(searchTermLower)
          )
        )
      );

      logger.info(`Search completed: ${collection}, term: ${searchTerm}, results: ${filteredData.length}`);
      
      return {
        success: true,
        message: `Search results for '${searchTerm}' in ${collection}`,
        data: {
          collection,
          items: filteredData as any,
          count: filteredData.length
        }
      };
    } catch (error) {
      logger.error('Error searching master data:', error);
      throw new Error('Failed to search master data');
    }
  }
}