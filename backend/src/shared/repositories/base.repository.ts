import {
  Document,
  Model,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  PipelineStage,
} from 'mongoose';
import { logger } from '../services/logger.service';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      const savedDocument = await document.save();
      logger.info(`Created ${this.model.modelName}`, { id: savedDocument._id });
      return savedDocument;
    } catch (error) {
      logger.error(`Error creating ${this.model.modelName}`, {
        error: String(error),
        data,
      });
      throw error;
    }
  }

  /**
   * Find a document by ID
   */
  async findById(id: string, projection?: any): Promise<T | null> {
    try {
      const document = await this.model.findById(id, projection);
      return document;
    } catch (error) {
      logger.error(`Error finding ${this.model.modelName} by ID`, {
        error: String(error),
        id,
      });
      throw error;
    }
  }

  /**
   * Find documents with filter
   */
  async find(
    filter: FilterQuery<T> = {},
    projection?: any,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const documents = await this.model.find(filter, projection, options);
      return documents;
    } catch (error) {
      logger.error(`Error finding ${this.model.modelName}`, {
        error: String(error),
        filter,
      });
      throw error;
    }
  }

  /**
   * Find one document with filter
   */
  async findOne(
    filter: FilterQuery<T> = {},
    projection?: any,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      const document = await this.model.findOne(filter, projection, options);
      return document;
    } catch (error) {
      logger.error(`Error finding one ${this.model.modelName}`, {
        error: String(error),
        filter,
      });
      throw error;
    }
  }

  /**
   * Update a document by ID
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      const document = await this.model.findByIdAndUpdate(id, update, {
        new: true,
        ...options,
      });
      if (document) {
        logger.info(`Updated ${this.model.modelName}`, { id });
      }
      return document;
    } catch (error) {
      logger.error(`Error updating ${this.model.modelName}`, {
        error: String(error),
        id,
        update,
      });
      throw error;
    }
  }

  /**
   * Update documents with filter
   */
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<any> {
    try {
      const result = await this.model.updateMany(filter, update, options as any);
      logger.info(`Updated multiple ${this.model.modelName}`, {
        filter,
        result,
      });
      return result;
    } catch (error) {
      logger.error(`Error updating multiple ${this.model.modelName}`, {
        error: String(error),
        filter,
        update,
      });
      throw error;
    }
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string): Promise<T | null> {
    try {
      const document = await this.model.findByIdAndDelete(id);
      if (document) {
        logger.info(`Deleted ${this.model.modelName}`, { id });
      }
      return document;
    } catch (error) {
      logger.error(`Error deleting ${this.model.modelName}`, {
        error: String(error),
        id,
      });
      throw error;
    }
  }

  /**
   * Delete documents with filter
   */
  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    try {
      const result = await this.model.deleteMany(filter);
      logger.info(`Deleted multiple ${this.model.modelName}`, {
        filter,
        result,
      });
      return result;
    } catch (error) {
      logger.error(`Error deleting multiple ${this.model.modelName}`, {
        error: String(error),
        filter,
      });
      throw error;
    }
  }

  /**
   * Count documents with filter
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      const count = await this.model.countDocuments(filter);
      return count;
    } catch (error) {
      logger.error(`Error counting ${this.model.modelName}`, {
        error: String(error),
        filter,
      });
      throw error;
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const exists = await this.model.exists(filter);
      return !!exists;
    } catch (error) {
      logger.error(`Error checking existence of ${this.model.modelName}`, {
        error: String(error),
        filter,
      });
      throw error;
    }
  }

  /**
   * Execute aggregation pipeline
   */
  async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    try {
      const results = await this.model.aggregate(pipeline);
      return results;
    } catch (error) {
      logger.error(`Error executing aggregation on ${this.model.modelName}`, {
        error: String(error),
        pipeline,
      });
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 },
    projection?: any
  ): Promise<{
    documents: T[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [documents, total] = await Promise.all([
        this.model.find(filter, projection).sort(sort).skip(skip).limit(limit),
        this.model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        documents,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding ${this.model.modelName} with pagination`, {
        error: String(error),
        filter,
        page,
        limit,
      });
      throw error;
    }
  }
}
