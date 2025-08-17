import mongoose, { Document, Model } from 'mongoose';

// Category Interface
export interface ICategory extends Document {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: mongoose.Types.ObjectId;
  path: string[];
  level: number;
  isActive: boolean;
  isSystem: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Category Model Interface with static methods
export interface ICategoryModel extends Model<ICategory> {
  getCategoryTree(userId: string): Promise<ICategory[]>;
  getCategoryPath(
    categoryId: string
  ): Promise<{ path: string[]; level: number }>;
}
