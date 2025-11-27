import { Response, NextFunction } from 'express';
import Category from '../models/Category';
import { AuthRequest } from '../middlewares/authMiddleware';

export const listCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const query: any = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    const categories = await Category.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveCategories = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.create({ name, description, isActive: isActive !== false });
    res.json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category with this name already exists' });
      return;
    }
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category with this name already exists' });
      return;
    }
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

