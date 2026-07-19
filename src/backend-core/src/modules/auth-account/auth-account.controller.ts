import { Request, Response, NextFunction } from 'express';
import { AuthAccountService } from './auth-account.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.verifyEmail(req.body.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT implementation, logout is mostly handled client-side by deleting the token.
    // If blacklisting is needed, it would be added here.
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.resetPasswordRequest(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AuthAccountService.updateProfile(req.user._id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
