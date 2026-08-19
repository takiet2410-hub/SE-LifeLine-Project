import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/common/AppLayout';

import { CampaignListPage } from '../modules/campaign-mgmt/pages/CampaignListPage';
import { CreateCampaignPage } from '../modules/campaign-mgmt/pages/CreateCampaignPage';
import { CampaignDetailPage } from '../modules/campaign-mgmt/pages/CampaignDetailPage';
import { RegistrationListPage } from '../modules/campaign-mgmt/pages/RegistrationListPage';
import { RegistrationDetailPage } from '../modules/campaign-mgmt/pages/RegistrationDetailPage';
import { QRScanPage } from '../modules/campaign-mgmt/pages/QRScanPage';

import { ArticleListPage } from '../modules/content-mgmt/pages/ArticleListPage';
import { CreateArticlePage } from '../modules/content-mgmt/pages/CreateArticlePage';
import { ArticleDetailPage } from '../modules/content-mgmt/pages/ArticleDetailPage';

import { NotificationListPage } from '../modules/notifications/pages/NotificationListPage';
import { NotificationDetailPage } from '../modules/notifications/pages/NotificationDetailPage';

import { InventoryListPage } from '../modules/blood-inventory/pages/InventoryListPage';
import { StockInPage } from '../modules/blood-inventory/pages/StockInPage';
import { StockOutPage } from '../modules/blood-inventory/pages/StockOutPage';
import { InventoryStatsPage } from '../modules/blood-inventory/pages/InventoryStatsPage';
import { BloodBagDetailPage } from '../modules/blood-inventory/pages/BloodBagDetailPage';

export const BloodCenterRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/bc" element={<Navigate to="/bc/campaigns" replace />} />

        {/* 1. Campaign Management Module */}
        <Route path="/bc/campaigns" element={<CampaignListPage />} />
        <Route path="/bc/campaigns/create" element={<CreateCampaignPage />} />
        <Route path="/bc/campaigns/:campaignId" element={<CampaignDetailPage />} />
        <Route path="/bc/campaigns/:campaignId/registrations" element={<RegistrationListPage />} />
        <Route path="/bc/campaigns/:campaignId/registrations/:registrationId" element={<RegistrationDetailPage />} />
        <Route path="/bc/campaigns/:campaignId/qr-scan" element={<QRScanPage />} />

        {/* 2. Content Management Module */}
        <Route path="/bc/content" element={<ArticleListPage />} />
        <Route path="/bc/content/create" element={<CreateArticlePage />} />
        <Route path="/bc/content/:articleId" element={<ArticleDetailPage />} />

        {/* 3. Notification Management Module */}
        <Route path="/bc/notifications" element={<NotificationListPage />} />
        <Route path="/bc/notifications/:notifId" element={<NotificationDetailPage />} />

        {/* 4. Blood Inventory Management Module */}
        <Route path="/bc/inventory" element={<InventoryListPage />} />
        <Route path="/bc/inventory/stock-in" element={<StockInPage />} />
        <Route path="/bc/inventory/stock-out" element={<StockOutPage />} />
        <Route path="/bc/inventory/stats" element={<InventoryStatsPage />} />
        <Route path="/bc/inventory/:bagId" element={<BloodBagDetailPage />} />
      </Route>
    </Routes>
  );
};
