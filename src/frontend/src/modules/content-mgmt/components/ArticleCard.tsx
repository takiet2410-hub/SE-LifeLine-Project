import React, { useState } from 'react';
import { Eye, Calendar, User, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import type { Article } from '../types/article.types';

interface ArticleCardProps {
  article: Article;
  onSelect?: (articleId: string) => void;
  onClick?: () => void;
  onEdit?: (articleId: string) => void;
  onDelete?: (article: Article) => void;
  variant?: 'admin' | 'public';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  variant = 'admin'
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: Article['status']) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Draft':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryBadge = (cat: Article['category']) => {
    switch (cat) {
      case 'Alert':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'Health Tips':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'Campaign':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'News':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative">
      {/* Cover image or placeholder */}
      <div
        className="h-44 bg-gray-100 relative overflow-hidden cursor-pointer"
        onClick={() => {
          if (onClick) onClick();
          else if (onSelect) onSelect(article._id);
        }}
      >
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-200 text-gray-400 font-medium text-sm">
            No Cover Image
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadge(article.category)}`}>
            {article.category}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(article.status)}`}>
            {article.status}
          </span>
        </div>

        {/* 3-dot dropdown menu */}
        {variant !== 'public' && onEdit && onDelete && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(article._id);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                <span>Edit Article</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(article);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Content body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => {
              if (onClick) onClick();
              else if (onSelect) onSelect(article._id);
            }}
            className="text-base font-bold text-gray-900 line-clamp-2 hover:text-red-600 cursor-pointer transition-colors"
          >
            {article.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">
            {(article.bodyContent || '').replace(/<[^>]*>/g, '') || 'No content preview available'}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate max-w-[100px]">{article.authorName}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{new Date(article.publishedAt || article.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <span className="flex items-center space-x-1 font-medium text-gray-700">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span>{(article.viewsCount || 0).toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
