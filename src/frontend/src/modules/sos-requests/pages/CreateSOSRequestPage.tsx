import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Droplet, User, Activity, Hospital } from 'lucide-react';
import { toast } from 'sonner';
import { sosApi, type CreateSOSRequestPayload, type SOSUrgency, type HospitalInfo } from '../services/sosApi';
import { useAuth } from '../../../shared/contexts/AuthContext';

const getDefaultDeadline = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

export const CreateSOSRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const assignedHospital = hospitals.find(hospital => hospital._id === user?.hospitalId);
  
  const [formData, setFormData] = useState<CreateSOSRequestPayload>(() => ({
    hospitalId: '',
    bloodType: '',
    requiredQuantityMl: 0,
    urgencyLevel: 'Critical',
    patientReference: '',
    fulfillmentDeadline: getDefaultDeadline(),
  }));
  
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSOSRequestPayload, string>>>({});


  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await sosApi.getHospitals();
        setHospitals(data);
        if (user?.hospitalId) {
          setFormData(prev => ({ ...prev, hospitalId: user.hospitalId! }));
        } else if (data.length === 1) {
          setFormData(prev => ({ ...prev, hospitalId: data[0]._id }));
        }
      } catch (error) {
        console.error('Failed to fetch hospitals', error);
      }
    };
    fetchHospitals();
  }, [user?.hospitalId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateSOSRequestPayload, string>> = {};
    
    if (!formData.hospitalId) {
      newErrors.hospitalId = 'Hospital is required';
    }
    if (!formData.bloodType) {
      newErrors.bloodType = 'Blood type is required';
    }
    if (!formData.requiredQuantityMl || formData.requiredQuantityMl < 250) {
      newErrors.requiredQuantityMl = 'Quantity must be at least 250 ml';
    }
    if (!formData.urgencyLevel) {
      newErrors.urgencyLevel = 'Urgency level is required';
    }
    if (!formData.patientReference?.trim()) {
      newErrors.patientReference = 'Patient reference is required';
    }
    if (!formData.fulfillmentDeadline) {
      newErrors.fulfillmentDeadline = 'Fulfillment deadline is required';
    } else {
      const deadline = new Date(formData.fulfillmentDeadline);
      const now = new Date();
      if (deadline <= now) {
        newErrors.fulfillmentDeadline = 'Deadline must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure the deadline is in strict ISO 8601 format with Z
      const isoDeadline = new Date(formData.fulfillmentDeadline).toISOString();
      
      const payload = {
        ...formData,
        requiredQuantityMl: Number(formData.requiredQuantityMl),
        fulfillmentDeadline: isoDeadline
      };
      
      await sosApi.createSOSRequest(payload);
      toast.success('SOS Request created successfully!');
      navigate('/hospital/sos-requests');
    } catch (error: any) {
      console.error('Failed to create SOS request:', error);
      toast.error(error.response?.data?.message || 'Failed to create SOS request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateSOSRequestPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/hospital/sos-requests')}
          className="p-2 hover:bg-brand-bg-muted rounded-full transition-colors text-brand-text-secondary"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-text-main">Create SOS Request</h1>
          <p className="text-brand-text-secondary mt-1">Submit an emergency request for blood products</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hospital & Staff Info */}
        <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-border bg-brand-bg-muted/30">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2">
              <Hospital className="w-5 h-5 text-brand-primary" />
              Hospital & Staff Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Medical Facility <span className="text-brand-error">*</span></label>
                <div className="w-full rounded-lg border border-brand-border-dark bg-brand-bg-muted/60 px-4 py-2.5 text-brand-text-main" aria-live="polite">
                  <span className="font-medium">{assignedHospital?.name || user?.hospitalName || 'Đang tải bệnh viện được phân công...'}</span>
                  {assignedHospital?.address && <span className="mt-0.5 block text-xs text-brand-text-muted">{assignedHospital.address}</span>}
                </div>
                <p className="mt-1 text-xs text-brand-text-muted">Bệnh viện được khóa theo tài khoản đăng nhập để tránh gửi nhầm yêu cầu y tế.</p>
                {errors.hospitalId && <p className="mt-1 text-sm text-brand-error">{errors.hospitalId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Staff Member</label>
                <div className="w-full px-4 py-2.5 bg-brand-bg-muted/50 border border-brand-border-dark rounded-lg text-brand-text-main flex flex-col justify-center">
                  <span className="font-medium">{user?.fullName || user?.idDocumentNumber || 'Hospital Staff'}</span>
                  {user?.idDocumentNumber && <span className="text-xs text-brand-text-muted">CCCD: {user.idDocumentNumber}</span>}
                  <span className="text-xs text-brand-text-muted">{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgency Level */}
        <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-border bg-brand-bg-muted/30">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-primary" />
              Request Urgency
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['Critical', 'High', 'Medium'] as SOSUrgency[]).map((level) => (
                <label key={level} className="relative flex cursor-pointer rounded-lg border border-brand-border p-4 shadow-sm focus:outline-none has-[:checked]:border-brand-primary has-[:checked]:ring-1 has-[:checked]:ring-brand-primary hover:bg-brand-bg-muted/50 transition-colors">
                  <input 
                    type="radio" 
                    name="urgency" 
                    value={level} 
                    className="sr-only" 
                    defaultChecked={level === 'Critical'}
                    onChange={() => handleChange('urgencyLevel', level)}
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <span className="block text-sm font-semibold text-brand-text-main">{level}</span>
                      <span className="mt-1 flex items-center text-xs text-brand-text-muted">
                        {level === 'Critical' ? 'Life-threatening, need within 2 hours' : 
                         level === 'High' ? 'Severe, need within 6 hours' : 'Need within 24 hours'}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blood Details */}
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-brand-border bg-brand-bg-muted/30">
              <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2">
                <Droplet className="w-5 h-5 text-brand-primary" />
                Blood Requirements
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Blood Type <span className="text-brand-error">*</span></label>
                <select 
                  required 
                  value={formData.bloodType}
                  onChange={(e) => handleChange('bloodType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {errors.bloodType && <p className="mt-1 text-sm text-brand-error">{errors.bloodType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Quantity (ml) <span className="text-brand-error">*</span></label>
                <input 
                  type="number" 
                  required 
                  min="250" 
                  step="250" 
                  placeholder="e.g. 1000" 
                  value={formData.requiredQuantityMl}
                  onChange={(e) => handleChange('requiredQuantityMl', Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main" 
                />
                {errors.requiredQuantityMl && <p className="mt-1 text-sm text-brand-error">{errors.requiredQuantityMl}</p>}
              </div>
            </div>
          </div>

          {/* Patient Details & Deadline */}
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-brand-border bg-brand-bg-muted/30">
              <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2">
                <User className="w-5 h-5 text-brand-primary" />
                Patient Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Patient Reference <span className="text-brand-error">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter patient name/reference" 
                  value={formData.patientReference}
                  onChange={(e) => handleChange('patientReference', e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main" 
                />
                {errors.patientReference && <p className="mt-1 text-sm text-brand-error">{errors.patientReference}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Fulfillment Deadline <span className="text-brand-error">*</span></label>
                <input 
                  type="datetime-local" 
                  required 
                  value={formData.fulfillmentDeadline}
                  onChange={(e) => handleChange('fulfillmentDeadline', e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main" 
                />
                {errors.fulfillmentDeadline && <p className="mt-1 text-sm text-brand-error">{errors.fulfillmentDeadline}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-brand-border bg-brand-bg-muted/30">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-primary" />
              Additional Notes
            </h2>
          </div>
          <div className="p-6">
            <textarea 
              rows={4} 
              placeholder="Any other important information for the Blood Center..." 
              className="w-full px-4 py-3 bg-brand-bg-muted border border-brand-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-brand-text-main resize-none" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/hospital/sos-requests')}
            className="px-6 py-2.5 border border-brand-border-dark rounded-lg text-brand-text-secondary font-medium hover:bg-brand-bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};
