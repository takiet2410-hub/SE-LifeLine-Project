import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Eye, Download, Tag, Share2 } from 'lucide-react';
import { articleApi } from '../services/articleApi';
import { SkeletonLoader } from '../../../components/common/SkeletonLoader';
import type { Article, ArticleCategory } from '../types/article.types';
import { format } from 'date-fns';
import { getApiErrorMessage } from '../../../shared/api/apiError';

export const PublicArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    try {
      const res = await articleApi.getPublicArticleById(articleId);
      if (res.success && res.data) {
        // Only show published articles to public
        if (res.data.status !== 'Published') {
          setError('Bài viết không tồn tại hoặc chưa được xuất bản');
        } else {
          setArticle(res.data);
        }
      } else {
        setError('Bài viết không tồn tại hoặc chưa được xuất bản');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể tải bài viết'));
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const formatDate = (dateStr: string) => format(new Date(dateStr), 'dd/MM/yyyy');
  const formatDateTime = (dateStr: string) => format(new Date(dateStr), 'dd/MM/yyyy HH:mm');

  const getCategoryColor = (category: ArticleCategory) => {
    switch (category) {
      case 'News': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Alert': return 'bg-red-50 text-red-700 border-red-100';
      case 'Educational': return 'bg-green-50 text-green-700 border-green-100';
      case 'Campaign': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareZalo = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://zalo.me/share?url=${url}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Đã sao chép liên kết bài viết!');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/news')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          <SkeletonLoader type="card" />
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        {/* Fake Blurred Background */}
        <div className="absolute inset-0 blur-sm opacity-50 bg-white pointer-events-none">
          <header className="bg-white border-b border-gray-200 h-16"></header>
          <main className="max-w-3xl mx-auto px-4 py-8">
            <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </main>
        </div>

        {/* 404 Modal Overlay */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-red-600">404</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Article Not Found</h2>
            <p className="text-gray-600 mb-8">
              This article has been removed or is no longer published.
            </p>
            <button
              onClick={() => navigate('/news')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to News Feed
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/news')}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Cover Image */}
          {article.coverImageUrl && (
            <div className="h-64 w-full overflow-hidden bg-gray-100 relative">
              <img 
                src={article.coverImageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            {/* Category & Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {article.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {article.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-y border-gray-100 py-4">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">{article.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{article.readTimeMinutes} min đọc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{article.viewsCount?.toLocaleString() || 0} lượt xem</span>
              </div>
            </div>

            {/* Category & Target Audience Tags */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(article.category)}`}>
                <Tag className="w-3 h-3 inline mr-1" />
                {article.category}
              </span>
              {article.targetAudience?.map((audience) => (
                <span key={audience} className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                  {audience}
                </span>
              ))}
            </div>

            {/* Article Body */}
            <div className="prose max-w-none text-gray-800 text-base md:text-lg leading-relaxed">
              {article.bodyContent ? (
                <div dangerouslySetInnerHTML={{ __html: article.bodyContent }} />
              ) : (
                <p className="text-gray-400 italic">Nội dung bài viết đang được cập nhật.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Chia sẻ:</span>
                <button 
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors" 
                  title="Chia sẻ Facebook"
                  onClick={shareFacebook}
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors" 
                  title="Chia sẻ Zalo"
                  onClick={shareZalo}
                >
                  <span className="text-lg font-bold">Z</span>
                </button>
                <button 
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors" 
                  title="Sao chép liên kết"
                  onClick={copyLink}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Đăng: {formatDateTime(article.publishedAt || article.createdAt)}</span>
                {article.updatedAt !== article.createdAt && (
                  <>
                    <span>•</span>
                    <span>Cập nhật: {formatDateTime(article.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Related articles would be fetched from API */}
            <div className="col-span-full text-center py-8 text-gray-500">
              Đang tải bài viết liên quan...
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicArticleDetailPage;
