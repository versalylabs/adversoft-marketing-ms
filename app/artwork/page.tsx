"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  ArtworkRecord,
  ArtworkStatus,
  CreativeFormat,
  ArtworkRevision,
  ApprovalAuditEntry,
  PrintHandoffTicket,
  getStoredArtworks,
  saveStoredArtworks,
  uploadArtworkRevision,
  requestArtworkRevision,
  approveArtwork,
  dispatchPrintTicket,
  createArtwork,
  getArtworkMetrics,
} from '@/lib/data/artwork-store';
import { getTenantBillboards } from '@/lib/tenant-store';
import { getStoredCampaigns } from '@/lib/data/campaigns-store';
import {
  Palette,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Sparkles,
  MapPin,
  ShieldCheck,
  Check,
  X,
  FileCheck2,
  FileBadge,
  Layers,
  UploadCloud,
  SplitSquareVertical,
  Printer,
  Truck,
  MessageSquare,
  FileText,
  Sliders,
  Maximize2,
  Download,
  Info,
  Calendar,
  Building,
  Tag,
  PenTool,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ArtworkStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING_UPLOAD: { label: 'Pending Upload', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  PREFLIGHT_CHECK: { label: 'Pre-flight Ingestion', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  IN_REVIEW: { label: 'Client In-Review', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  REVISION_REQUESTED: { label: 'Revision Requested', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertTriangle },
  CLIENT_APPROVED: { label: 'Client Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  SENT_TO_PRINT: { label: 'Dispatched to Print', bg: 'bg-purple-50', text: 'text-purple-700', icon: Printer },
  READY_FOR_INSTALL: { label: 'Ready at Depot', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: Truck },
};

const FORMAT_CONFIG: Record<CreativeFormat, { label: string; badge: string }> = {
  VINYL_BULLETIN: { label: '14oz Vinyl Bulletin', badge: 'bg-slate-100 text-slate-700' },
  BREATHABLE_MESH: { label: 'Perforated Wall Mesh', badge: 'bg-blue-50 text-blue-700' },
  TRANSIT_SHELTER: { label: 'Backlit Duratrans Film', badge: 'bg-amber-50 text-amber-700' },
  DIGITAL_MP4: { label: '4K Digital Video (MP4)', badge: 'bg-indigo-50 text-indigo-700' },
  DIGITAL_STATIC_JPEG: { label: 'Digital Static (RGB)', badge: 'bg-purple-50 text-purple-700' },
  POSTER_PAPER: { label: '30-Sheet Eco Poster', badge: 'bg-emerald-50 text-emerald-700' },
};

export default function ArtworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Artworks list
  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [campaignFilter, setCampaignFilter] = useState<string>('ALL');

  // Drawers & Modals
  const [inspectArtwork, setInspectArtwork] = useState<ArtworkRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'VERSIONS' | 'APPROVAL' | 'PRINT'>('PREVIEW');
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [printableCertificate, setPrintableCertificate] = useState<ArtworkRecord | null>(null);

  // Modal dialog states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states: Revision Upload
  const [newRevisionFileUrl, setNewRevisionFileUrl] = useState('');
  const [newRevisionNotes, setNewRevisionNotes] = useState('');
  const [newRevisionDpi, setNewRevisionDpi] = useState<number>(300);

  // Form states: Request Revision
  const [revisionFeedbackText, setRevisionFeedbackText] = useState('');
  const [revisionRequestor, setRevisionRequestor] = useState('Client Brand Team');

  // Form states: Client Approval
  const [approverName, setApproverName] = useState('Authorized Client Officer');
  const [approverEmail, setApproverEmail] = useState('approvals@clientbrand.com');
  const [approverRole, setApproverRole] = useState('Chief Marketing Officer');
  const [approvalNotes, setApprovalNotes] = useState('Design approved without exception. Verified for live display.');

  // Form states: Print Dispatch
  const [printVendor, setPrintVendor] = useState('Metropolitan Billboard Printers Inc');
  const [printVendorContact, setPrintVendorContact] = useState('orders@metroprintny.com');
  const [printMaterial, setPrintMaterial] = useState('14oz Ultraflex Heavyweight Matte Vinyl with UV Inhibitor');
  const [printFinishing, setPrintFinishing] = useState('Double-stitched 3in top & bottom pockets with rustproof brass grommets.');
  const [printBleed, setPrintBleed] = useState<number>(3);
  const [printDepot, setPrintDepot] = useState('Brooklyn Operations & Staging Depot (220 3rd Ave)');
  const [printShipDate, setPrintShipDate] = useState('2026-10-25');

  // Form states: Create Artwork
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtCampaignId, setNewArtCampaignId] = useState('');
  const [newArtBillboardId, setNewArtBillboardId] = useState('');
  const [newArtFormat, setNewArtFormat] = useState<CreativeFormat>('VINYL_BULLETIN');
  const [newArtDeadline, setNewArtDeadline] = useState('2026-11-01');
  const [newArtFileUrl, setNewArtFileUrl] = useState('');

  // Load artworks
  const refreshArtworks = () => {
    const list = getStoredArtworks();
    setArtworks(list);
  };

  useEffect(() => {
    refreshArtworks();
    const handleUpdate = () => refreshArtworks();
    window.addEventListener('adversoft_artworks_updated', handleUpdate);
    return () => window.removeEventListener('adversoft_artworks_updated', handleUpdate);
  }, []);

  const metrics = useMemo(() => getArtworkMetrics(), [artworks]);
  const campaigns = useMemo(() => getStoredCampaigns(), [artworks]);
  const billboards = useMemo(() => getTenantBillboards(), [artworks]);

  // Filtered list
  const filteredArtworks = useMemo(() => {
    return artworks.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (formatFilter !== 'ALL' && a.format !== formatFilter) return false;
      if (campaignFilter !== 'ALL' && a.campaignId !== campaignFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = a.artworkNumber.toLowerCase().includes(q);
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesCampaign = a.campaignName.toLowerCase().includes(q);
        const matchesClient = a.clientCompanyName.toLowerCase().includes(q);
        const matchesBb = a.billboardCode.toLowerCase().includes(q) || a.billboardCity.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesCampaign && !matchesClient && !matchesBb) {
          return false;
        }
      }
      return true;
    });
  }, [artworks, statusFilter, formatFilter, campaignFilter, searchQuery]);

  // Handle Upload Revision
  const handleUploadRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectArtwork) return;
    if (!newRevisionFileUrl.trim()) {
      toast({ title: 'Missing URL', description: 'Please provide high-resolution file URL.', type: 'destructive' });
      return;
    }

    const res = uploadArtworkRevision(inspectArtwork.id, {
      fileUrl: newRevisionFileUrl,
      feedbackNotes: newRevisionNotes,
      resolutionDpi: Number(newRevisionDpi),
    });

    if (res.success && res.artwork) {
      toast({
        title: 'New Revision Uploaded',
        description: `Revision v${res.artwork.currentVersion} preflight checked and submitted for review.`,
        type: 'success',
      });
      refreshArtworks();
      setInspectArtwork(res.artwork);
      setIsUploadModalOpen(false);
      setNewRevisionFileUrl('');
      setNewRevisionNotes('');
    } else {
      toast({ title: 'Upload Failed', description: res.error || 'Failed to submit revision.', type: 'destructive' });
    }
  };

  // Handle Request Revision
  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectArtwork) return;
    if (!revisionFeedbackText.trim()) {
      toast({ title: 'Feedback Required', description: 'Please specify the changes required.', type: 'destructive' });
      return;
    }

    const res = requestArtworkRevision(inspectArtwork.id, revisionFeedbackText, revisionRequestor);
    if (res.success && res.artwork) {
      toast({
        title: 'Revision Request Logged',
        description: 'Design production team notified with feedback.',
        type: 'success',
      });
      refreshArtworks();
      setInspectArtwork(res.artwork);
      setIsRevisionModalOpen(false);
      setRevisionFeedbackText('');
    } else {
      toast({ title: 'Request Failed', description: res.error || 'Failed to log revision.', type: 'destructive' });
    }
  };

  // Handle Client Approval
  const handleApproveArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectArtwork) return;

    const res = approveArtwork(inspectArtwork.id, {
      approvedBy: approverName,
      approverEmail,
      approverRole,
      notes: approvalNotes,
    });

    if (res.success && res.artwork) {
      toast({
        title: 'Artwork Approved by Client',
        description: `Cryptographic audit hash registered for v${res.artwork.currentVersion}.`,
        type: 'success',
      });
      refreshArtworks();
      setInspectArtwork(res.artwork);
      setIsApprovalModalOpen(false);
    } else {
      toast({ title: 'Approval Failed', description: res.error || 'Failed to approve artwork.', type: 'destructive' });
    }
  };

  // Handle Dispatch Print
  const handleDispatchPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectArtwork) return;

    const res = dispatchPrintTicket(inspectArtwork.id, {
      vendorName: printVendor,
      vendorContact: printVendorContact,
      materialType: printMaterial,
      finishingInstructions: printFinishing,
      bleedInches: Number(printBleed),
      deliveryDepot: printDepot,
      targetShipDate: printShipDate,
    });

    if (res.success && res.artwork) {
      toast({
        title: 'Print Ticket Dispatched',
        description: `Dispatched ${res.artwork.printTicket?.ticketNumber} to ${printVendor}.`,
        type: 'success',
      });
      refreshArtworks();
      setInspectArtwork(res.artwork);
      setIsPrintModalOpen(false);
    } else {
      toast({ title: 'Dispatch Failed', description: res.error || 'Failed to dispatch ticket.', type: 'destructive' });
    }
  };

  // Handle Create Artwork
  const handleCreateArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtCampaignId || !newArtBillboardId) {
      toast({ title: 'Missing Information', description: 'Please select campaign and billboard site.', type: 'destructive' });
      return;
    }
    if (!newArtFileUrl.trim()) {
      toast({ title: 'Artwork Image Required', description: 'Please provide artwork proof image URL.', type: 'destructive' });
      return;
    }

    const res = createArtwork({
      title: newArtTitle || 'New Billboard Creative',
      campaignId: newArtCampaignId,
      billboardId: newArtBillboardId,
      format: newArtFormat,
      deadlineDate: newArtDeadline,
      fileUrl: newArtFileUrl,
    });

    if (res.success && res.artwork) {
      toast({
        title: 'Creative Ingested',
        description: `Artwork asset ${res.artwork.artworkNumber} initialized for review.`,
        type: 'success',
      });
      refreshArtworks();
      setInspectArtwork(res.artwork);
      setIsCreateModalOpen(false);
      setNewArtTitle('');
      setNewArtFileUrl('');
    } else {
      toast({ title: 'Ingestion Failed', description: res.error || 'Failed to create artwork.', type: 'destructive' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Artwork & Approval Workflow</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Certified Proofs
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                FOGRA39 Pre-flight
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              High-res creative uploads, version comparisons, revision annotations, client approval audit trails, and print vendor handoffs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshArtworks}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              title="Refresh creative assets"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                if (campaigns.length === 0 || billboards.length === 0) {
                  toast({
                    title: 'Prerequisite Required',
                    description: 'Please register at least one Campaign and Billboard before ingesting artwork.',
                    type: 'destructive',
                  });
                  return;
                }
                setNewArtCampaignId(campaigns[0].id);
                setNewArtBillboardId(billboards[0].id);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Creative Ingestion</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards (Premium Dashboard Aesthetic: No black borders, soft shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card
            onClick={() => setStatusFilter('IN_REVIEW')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-amber-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Review</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">{metrics.inReviewCount}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting client sign-off or QA inspection</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('REVISION_REQUESTED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-rose-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Revisions in Flight</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-600">{metrics.revisionCount}</div>
              <p className="text-xs text-gray-500 mt-1">Client feedback annotations requiring updates</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('CLIENT_APPROVED')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-emerald-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Client Approved</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">{metrics.approvedCount}</div>
              <p className="text-xs text-gray-500 mt-1">SHA-256 cryptographic sign-offs locked</p>
            </div>
          </Card>

          <Card
            onClick={() => setStatusFilter('SENT_TO_PRINT')}
            className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-purple-200 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Print Handoff</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Printer className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.sentToPrintCount + metrics.readyInstallCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">Dispatched to vendor or staged at depot</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-5 shadow-sm bg-white border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approval SLA</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-indigo-600">{metrics.avgTurnaroundHours} hrs</div>
              <p className="text-xs text-gray-500 mt-1">Average creative review turnaround time</p>
            </div>
          </Card>
        </div>

        {/* Filter & Search Ribbon */}
        <Card className="rounded-2xl p-4 shadow-sm bg-white border border-gray-100">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by artwork ref, creative title, billboard code, campaign, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/70 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900 transition placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="REVISION_REQUESTED">Revision Requested</option>
                  <option value="CLIENT_APPROVED">Client Approved</option>
                  <option value="SENT_TO_PRINT">Sent to Print</option>
                  <option value="READY_FOR_INSTALL">Ready at Depot</option>
                </select>
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-2 rounded-xl text-xs font-medium text-gray-700">
                <span>Format:</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Formats</option>
                  <option value="VINYL_BULLETIN">14oz Vinyl Bulletin</option>
                  <option value="DIGITAL_MP4">4K Digital Video (MP4)</option>
                  <option value="DIGITAL_STATIC_JPEG">Digital Static (RGB)</option>
                  <option value="BREATHABLE_MESH">Perforated Mesh</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(statusFilter !== 'ALL' || formatFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setFormatFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Master Artwork Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtworks.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm text-gray-400">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Creative Assets Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
                {artworks.length === 0
                  ? 'Your workspace has no creative artwork proofs yet. Ingest digital or print graphics to initiate client proofing and pre-flight approvals.'
                  : 'No artworks matched your current filter or search criteria.'}
              </p>
              {artworks.length === 0 && (
                <button
                  onClick={() => {
                    if (campaigns.length === 0 || billboards.length === 0) {
                      toast({
                        title: 'Prerequisite Required',
                        description: 'Please register at least one Campaign and Billboard before ingesting artwork.',
                        type: 'destructive',
                      });
                      return;
                    }
                    setNewArtCampaignId(campaigns[0].id);
                    setNewArtBillboardId(billboards[0].id);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ingest First Creative Proof</span>
                </button>
              )}
            </div>
          ) : (
            filteredArtworks.map((art) => {
              const statusMeta = STATUS_CONFIG[art.status];
              const formatMeta = FORMAT_CONFIG[art.format];
              const StatusIcon = statusMeta.icon;
              const currentRev = art.revisions[art.revisions.length - 1];

              return (
                <div
                  key={art.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
                >
                  {/* Top Preview Image Container */}
                  <div
                    onClick={() => {
                      setInspectArtwork(art);
                      setActiveTab('PREVIEW');
                    }}
                    className="h-48 bg-gray-900 relative cursor-pointer overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentRev?.thumbnailUrl || currentRev?.fileUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Gradient Overlay for badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] bg-black/60 backdrop-blur-md text-white font-mono font-semibold px-2 py-0.5 rounded-full">
                        {art.artworkNumber}
                      </span>
                      <span className="text-[10px] bg-indigo-600/90 text-white font-bold px-2 py-0.5 rounded-full">
                        v{art.currentVersion}
                      </span>
                    </div>

                    {/* Bottom overlay details */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${formatMeta.badge}`}>
                        {formatMeta.label}
                      </span>
                      <div className="text-white text-xs font-semibold mt-1 truncate">
                        {art.billboardCode} • {art.billboardCity} ({currentRev?.dimensions})
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusMeta.label}</span>
                        </span>
                        <span className="text-[10px] text-gray-400">Due {art.deadlineDate}</span>
                      </div>

                      <h3
                        onClick={() => {
                          setInspectArtwork(art);
                          setActiveTab('PREVIEW');
                        }}
                        className="font-bold text-gray-900 text-sm line-clamp-1 hover:text-indigo-600 cursor-pointer transition"
                      >
                        {art.title}
                      </h3>

                      <p className="text-gray-500 mt-1 line-clamp-1">
                        Campaign: <strong className="text-gray-700">{art.campaignName}</strong>
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        Client: {art.clientCompanyName}
                      </p>

                      {/* Preflight Specs pill */}
                      <div className="mt-3 p-2.5 bg-gray-50/70 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                          <span>Color / DPI:</span>
                          <span className="font-semibold text-gray-900">
                            {currentRev?.colorSpace} • {currentRev?.resolutionDpi} DPI
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                          <span>Pre-flight Check:</span>
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Verified
                          </span>
                        </div>
                      </div>

                      {/* Revision Feedback alert if requested */}
                      {art.status === 'REVISION_REQUESTED' && currentRev?.revisionReason && (
                        <div className="mt-2.5 p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl text-rose-800 text-[11px]">
                          <strong>Feedback:</strong> {currentRev.revisionReason}
                        </div>
                      )}

                      {/* Approval hash pill if approved */}
                      {art.status === 'CLIENT_APPROVED' && art.approvalAudit.length > 0 && (
                        <div className="mt-2.5 p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 text-[10px] font-mono flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Approved by {art.approvalAudit[0].approvedBy}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setInspectArtwork(art);
                          setActiveTab('PREVIEW');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect & Compare</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Quick Request Revision button */}
                        {art.status === 'IN_REVIEW' && (
                          <button
                            onClick={() => {
                              setInspectArtwork(art);
                              setIsRevisionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                            title="Request Revision from Creative Team"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Quick Client Approval button */}
                        {['IN_REVIEW', 'PREFLIGHT_CHECK', 'REVISION_REQUESTED'].includes(art.status) && (
                          <button
                            onClick={() => {
                              setInspectArtwork(art);
                              setIsApprovalModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="Apply Client Digital Approval"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Dispatch Print Ticket button */}
                        {art.status === 'CLIENT_APPROVED' && !art.format.startsWith('DIGITAL') && (
                          <button
                            onClick={() => {
                              setInspectArtwork(art);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                            title="Dispatch Print Handoff Ticket"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        )}

                        {/* Certificate Print button */}
                        <button
                          onClick={() => setPrintableCertificate(art)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
                          title="Print Approval & Pre-flight Certificate"
                        >
                          <FileBadge className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE ARTWORK INSPECTION & VERSION COMPARISON DRAWER */}
        {/* ========================================================================= */}
        {inspectArtwork && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-4xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Top Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {inspectArtwork.artworkNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          STATUS_CONFIG[inspectArtwork.status].bg
                        } ${STATUS_CONFIG[inspectArtwork.status].text}`}
                      >
                        {STATUS_CONFIG[inspectArtwork.status].label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold font-mono">
                        Current: v{inspectArtwork.currentVersion}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mt-1">{inspectArtwork.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {inspectArtwork.clientCompanyName} • Billboard: {inspectArtwork.billboardCode} (
                      {inspectArtwork.billboardCity}) • {FORMAT_CONFIG[inspectArtwork.format].label}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPrintableCertificate(inspectArtwork)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-indigo-600 shadow-sm transition"
                      title="Print Certificate"
                    >
                      <FileBadge className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setInspectArtwork(null)}
                      className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-3 mt-5 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('PREVIEW')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'PREVIEW'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    High-Res Preview & Preflight
                  </button>
                  <button
                    onClick={() => setActiveTab('VERSIONS')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'VERSIONS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Side-by-Side Comparison ({inspectArtwork.revisions.length} Revisions)
                  </button>
                  <button
                    onClick={() => setActiveTab('APPROVAL')}
                    className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                      activeTab === 'APPROVAL'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Client Sign-Off & Audit ({inspectArtwork.approvalAudit.length})
                  </button>
                  {!inspectArtwork.format.startsWith('DIGITAL') && (
                    <button
                      onClick={() => setActiveTab('PRINT')}
                      className={`pb-2.5 px-2 text-xs font-semibold transition border-b-2 ${
                        activeTab === 'PRINT'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Print Handoff Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* TAB 1: HIGH-RES PREVIEW & PREFLIGHT CHECK */}
                {activeTab === 'PREVIEW' && (
                  <div className="space-y-6">
                    {/* Big Visual Preview */}
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-950 relative">
                      <div className="max-h-[380px] flex items-center justify-center p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.fileUrl
                          }
                          alt={inspectArtwork.title}
                          className="max-h-[360px] w-auto object-contain rounded-lg shadow-lg"
                        />
                      </div>
                      <div className="p-3 bg-gray-900/90 text-white flex items-center justify-between text-[11px]">
                        <span className="font-mono">
                          Current Revision: v{inspectArtwork.currentVersion} • Dimensions:{' '}
                          {inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.dimensions}
                        </span>
                        <a
                          href={inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Open Full Size</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Pre-flight Technical Specifications */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Pre-flight Technical Verification</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-gray-50 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Color Space</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            {inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.colorSpace}
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {inspectArtwork.format.startsWith('DIGITAL') ? 'sRGB / Rec.709' : 'CMYK Fogra39'}
                          </span>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Resolution Sharpness</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            {inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.resolutionDpi} DPI
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Optimal density</span>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Aspect Ratio</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            {inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.aspectRatio}
                          </div>
                          <span className="text-[10px] text-gray-500">Matches billboard face</span>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">File Package Size</span>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">
                            {(
                              (inspectArtwork.revisions[inspectArtwork.revisions.length - 1]
                                ?.fileSizeBytes || 0) /
                              (1024 * 1024)
                            ).toFixed(1)}{' '}
                            MB
                          </div>
                          <span className="text-[10px] text-gray-500">High-bitrate master</span>
                        </div>
                      </div>

                      {/* Pre-flight Checklist Items */}
                      <div className="mt-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                        <span className="font-semibold text-emerald-950 block">Preflight Verification Checklist:</span>
                        <div className="space-y-1 text-emerald-900">
                          {inspectArtwork.revisions[inspectArtwork.revisions.length - 1]?.preflightNotes.map(
                            (note, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>{note}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SIDE-BY-SIDE REVISION COMPARISON */}
                {activeTab === 'VERSIONS' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Revision Comparisons</h4>
                        <p className="text-gray-500">
                          Inspect design evolutions and compare revision changes side-by-side.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Upload New Revision</span>
                      </button>
                    </div>

                    {/* Side-by-Side Comparison Container */}
                    {inspectArtwork.revisions.length > 1 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Left: Previous Revision */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">
                              Revision v{inspectArtwork.revisions[0].version} (Initial)
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {inspectArtwork.revisions[0].uploadedAt}
                            </span>
                          </div>
                          <div className="h-52 bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={inspectArtwork.revisions[0].fileUrl}
                              alt="Previous revision"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {inspectArtwork.revisions[0].revisionReason && (
                            <div className="p-2 bg-rose-50 text-rose-800 rounded-lg text-[11px]">
                              <strong>Change Requested:</strong> {inspectArtwork.revisions[0].revisionReason}
                            </div>
                          )}
                        </div>

                        {/* Right: Current Revision */}
                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-950 text-sm">
                              Revision v{inspectArtwork.revisions[inspectArtwork.revisions.length - 1].version} (Current)
                            </span>
                            <span className="text-[10px] text-indigo-700 font-semibold">Active Proof</span>
                          </div>
                          <div className="h-52 bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                inspectArtwork.revisions[inspectArtwork.revisions.length - 1].fileUrl
                              }
                              alt="Current revision"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[11px]">
                            <strong>Preflight Certified:</strong> Color profile adjusted and typography legibility optimized.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        <SplitSquareVertical className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">Single Revision on Record</p>
                        <p className="text-xs mt-1">
                          Upload revision v2 to unlock side-by-side visual difference comparisons.
                        </p>
                      </div>
                    )}

                    {/* Timeline List */}
                    <div className="space-y-3">
                      <span className="font-bold text-gray-900 block">Revision Audit Trail</span>
                      <div className="space-y-2">
                        {inspectArtwork.revisions.map((rev) => (
                          <div
                            key={rev.version}
                            className="p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">Revision v{rev.version}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">Uploaded by {rev.uploadedBy}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {rev.dimensions}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {rev.feedbackNotes || 'Uploaded for review and client sign-off.'}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-400">{rev.uploadedAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CLIENT SIGN-OFF & CRYPTOGRAPHIC AUDIT */}
                {activeTab === 'APPROVAL' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Client Approval Audit Trail</h4>
                        <p className="text-gray-500">
                          Legally binding digital approval records with IP address tracking and cryptographic hashes.
                        </p>
                      </div>

                      {inspectArtwork.status !== 'CLIENT_APPROVED' && (
                        <button
                          onClick={() => setIsApprovalModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve & Sign Off</span>
                        </button>
                      )}
                    </div>

                    {inspectArtwork.approvalAudit.length === 0 ? (
                      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">Awaiting Client Approval</p>
                        <p className="text-xs mt-1">
                          The client has not yet executed a digital sign-off on revision v
                          {inspectArtwork.currentVersion}.
                        </p>
                        <button
                          onClick={() => setIsApprovalModalOpen(true)}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Execute Client Sign-off
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {inspectArtwork.approvalAudit.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                                  <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-sm">
                                    Approved by {entry.approvedBy} ({entry.approverRole})
                                  </div>
                                  <p className="text-[11px] text-gray-600">
                                    Email: {entry.approverEmail} • IP: {entry.ipAddress}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">
                                Verified Sign-off
                              </span>
                            </div>

                            <p className="text-gray-700 italic text-[11px] bg-white/70 p-3 rounded-xl border border-emerald-100">
                              &ldquo;{entry.notes}&rdquo;
                            </p>

                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                              <span>Audit Hash: {entry.signatureHash}</span>
                              <span>Timestamp: {entry.approvedAt}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PRINT HANDOFF TICKET */}
                {activeTab === 'PRINT' && !inspectArtwork.format.startsWith('DIGITAL') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">Print Production Handoff</h4>
                        <p className="text-gray-500">
                          Grand-format specifications, finishing details, and vendor logistics.
                        </p>
                      </div>

                      {!inspectArtwork.printTicket && inspectArtwork.status === 'CLIENT_APPROVED' && (
                        <button
                          onClick={() => setIsPrintModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Dispatch to Print Vendor</span>
                        </button>
                      )}
                    </div>

                    {inspectArtwork.printTicket ? (
                      <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Ticket Ref</span>
                            <div className="font-bold text-gray-900 text-sm">
                              {inspectArtwork.printTicket.ticketNumber}
                            </div>
                          </div>
                          <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full">
                            {inspectArtwork.printTicket.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-semibold">Vendor</span>
                            <div className="font-bold text-gray-900 mt-0.5">
                              {inspectArtwork.printTicket.vendorName}
                            </div>
                            <div className="text-gray-500">{inspectArtwork.printTicket.vendorContact}</div>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-semibold">Ship Target</span>
                            <div className="font-bold text-gray-900 mt-0.5">
                              {inspectArtwork.printTicket.targetShipDate}
                            </div>
                            <div className="text-gray-500 font-mono text-[10px]">
                              Tracking: {inspectArtwork.printTicket.trackingNumber || 'Pending pickup'}
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl space-y-1">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Substrate & Bleed:</span>
                          <p className="font-semibold text-gray-900">{inspectArtwork.printTicket.materialType}</p>
                          <p className="text-gray-600 text-[11px]">
                            Bleed: {inspectArtwork.printTicket.bleedInches} inches on all perimeter edges.
                          </p>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl space-y-1">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Finishing Instructions:</span>
                          <p className="text-gray-700 text-[11px]">{inspectArtwork.printTicket.finishingInstructions}</p>
                        </div>

                        <div className="p-3.5 bg-gray-50 rounded-xl space-y-1">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">Delivery Staging Depot:</span>
                          <p className="font-semibold text-indigo-900">{inspectArtwork.printTicket.deliveryDepot}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        <Printer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="font-semibold text-gray-700">No Print Ticket Dispatched</p>
                        <p className="text-xs mt-1">
                          Once client approves the creative, dispatch the print ticket with material specs and
                          shipping instructions.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <button
                  onClick={() => setInspectArtwork(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintableCertificate(inspectArtwork)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-xs font-semibold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Approval Certificate</span>
                  </button>

                  {inspectArtwork.status === 'IN_REVIEW' && (
                    <button
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl hover:bg-rose-100 transition"
                    >
                      Request Revision
                    </button>
                  )}

                  {['IN_REVIEW', 'REVISION_REQUESTED', 'PREFLIGHT_CHECK'].includes(inspectArtwork.status) && (
                    <button
                      onClick={() => setIsApprovalModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
                    >
                      Client Sign-Off
                    </button>
                  )}

                  {inspectArtwork.status === 'CLIENT_APPROVED' && !inspectArtwork.format.startsWith('DIGITAL') && (
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 shadow-sm transition"
                    >
                      Dispatch Print Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UPLOAD REVISION MODAL */}
        {/* ========================================================================= */}
        {isUploadModalOpen && inspectArtwork && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Upload Revision v{inspectArtwork.currentVersion + 1}</h3>
                    <p className="text-xs text-gray-500">{inspectArtwork.artworkNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadRevision} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">High-Resolution Asset URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={newRevisionFileUrl}
                    onChange={(e) => setNewRevisionFileUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setNewRevisionFileUrl(
                          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Luxury Watch Proof
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewRevisionFileUrl(
                          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Highway Bulletin Proof
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Pre-flight Target DPI</label>
                  <input
                    type="number"
                    value={newRevisionDpi}
                    onChange={(e) => setNewRevisionDpi(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Revision Changelog / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific modifications (e.g. Adjusted brand logo size, boosted contrast, verified bleed)..."
                    value={newRevisionNotes}
                    onChange={(e) => setNewRevisionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Upload & Run Pre-flight QA
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REQUEST REVISION MODAL */}
        {/* ========================================================================= */}
        {isRevisionModalOpen && inspectArtwork && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Request Creative Revision</h3>
                    <p className="text-xs text-gray-500">{inspectArtwork.artworkNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRequestRevision} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Feedback Requested By</label>
                  <input
                    type="text"
                    value={revisionRequestor}
                    onChange={(e) => setRevisionRequestor(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Revision Instructions *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Specify exact modifications required (e.g. Logo contrast is low against dark background, scale legal disclaimer to 24pt, correct product copy)..."
                    value={revisionFeedbackText}
                    onChange={(e) => setRevisionFeedbackText(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRevisionModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 shadow-sm transition"
                  >
                    Submit Revision Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLIENT DIGITAL APPROVAL MODAL */}
        {/* ========================================================================= */}
        {isApprovalModalOpen && inspectArtwork && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Client Digital Sign-Off</h3>
                    <p className="text-xs text-gray-500">{inspectArtwork.artworkNumber} • v{inspectArtwork.currentVersion}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleApproveArtwork} className="p-6 space-y-4 text-xs">
                <p className="text-gray-600">
                  By executing this sign-off, you approve revision{' '}
                  <strong className="text-gray-900">v{inspectArtwork.currentVersion}</strong> as final print-ready /
                  broadcast-ready creative for{' '}
                  <strong className="text-gray-900">{inspectArtwork.billboardCode}</strong>.
                </p>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Signatory Full Name *</label>
                  <input
                    type="text"
                    required
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    required
                    value={approverRole}
                    onChange={(e) => setApproverRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={approverEmail}
                    onChange={(e) => setApproverEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {approverName && (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                      Signature Stamp
                    </span>
                    <div className="font-serif italic text-2xl text-emerald-950 mt-1">
                      {approverName}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
                  >
                    Lock Digital Approval
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DISPATCH PRINT TICKET MODAL */}
        {/* ========================================================================= */}
        {isPrintModalOpen && inspectArtwork && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Dispatch Print Handoff Ticket</h3>
                    <p className="text-xs text-gray-500">{inspectArtwork.artworkNumber} • {inspectArtwork.billboardCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchPrint} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Print Vendor *</label>
                  <input
                    type="text"
                    required
                    value={printVendor}
                    onChange={(e) => setPrintVendor(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vendor Contact Email</label>
                  <input
                    type="email"
                    required
                    value={printVendorContact}
                    onChange={(e) => setPrintVendorContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Bleed Allowance (Inches)</label>
                    <input
                      type="number"
                      value={printBleed}
                      onChange={(e) => setPrintBleed(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Target Ship Date</label>
                    <input
                      type="date"
                      required
                      value={printShipDate}
                      onChange={(e) => setPrintShipDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Material Substrate</label>
                  <input
                    type="text"
                    value={printMaterial}
                    onChange={(e) => setPrintMaterial(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Finishing & Pocket Instructions</label>
                  <textarea
                    rows={2}
                    value={printFinishing}
                    onChange={(e) => setPrintFinishing(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Destination Field Depot</label>
                  <input
                    type="text"
                    value={printDepot}
                    onChange={(e) => setPrintDepot(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 shadow-sm transition"
                  >
                    Dispatch Handoff Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEW CREATIVE INGESTION MODAL */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ingest New Creative Proof</h3>
                  <p className="text-xs text-gray-500">Initialize asset review for billboard campaign.</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateArtwork} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Creative Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q1 National Holiday Master"
                    value={newArtTitle}
                    onChange={(e) => setNewArtTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Campaign *</label>
                    <select
                      required
                      value={newArtCampaignId}
                      onChange={(e) => setNewArtCampaignId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.campaignNumber} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Target Billboard *</label>
                    <select
                      required
                      value={newArtBillboardId}
                      onChange={(e) => setNewArtBillboardId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {billboards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} ({b.location.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Creative Format *</label>
                    <select
                      value={newArtFormat}
                      onChange={(e) => setNewArtFormat(e.target.value as CreativeFormat)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="VINYL_BULLETIN">14oz Vinyl Bulletin</option>
                      <option value="DIGITAL_MP4">4K Digital Video (MP4)</option>
                      <option value="DIGITAL_STATIC_JPEG">Digital Static (RGB)</option>
                      <option value="BREATHABLE_MESH">Perforated Mesh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Sign-Off Deadline</label>
                    <input
                      type="date"
                      required
                      value={newArtDeadline}
                      onChange={(e) => setNewArtDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Proof Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={newArtFileUrl}
                    onChange={(e) => setNewArtFileUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setNewArtFileUrl(
                          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Luxury Watch
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewArtFileUrl(
                          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80'
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Use Demo Electric Car
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition"
                  >
                    Ingest & Initiate Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRINTABLE APPROVAL & PRE-FLIGHT CERTIFICATE (window.print() ready) */}
        {/* ========================================================================= */}
        {printableCertificate && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
              {/* Toolbar */}
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileBadge className="h-5 w-5 text-indigo-400" />
                  <span className="font-semibold text-sm">
                    Pre-Flight & Creative Sign-Off Certificate — {printableCertificate.artworkNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    onClick={() => setPrintableCertificate(null)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Certificate Body */}
              <div className="p-10 space-y-8 text-gray-800 text-xs font-sans bg-white leading-relaxed">
                {/* Header */}
                <div className="border-b border-gray-200 pb-6 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                      Adversoft Outdoor Media LLC
                    </h1>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Technical Pre-Flight Certification & Client Artwork Sign-Off Bureau
                    </p>
                    <p className="text-gray-500 text-xs">
                      Creative QA Operations • print-qa@adversoft.com
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      CERTIFICATE #{printableCertificate.artworkNumber}-V{printableCertificate.currentVersion}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Issue Date: {new Date().toISOString().split('T')[0]}
                    </div>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      {printableCertificate.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Section 1: Specifications */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    1. CERTIFIED ASSET SPECIFICATIONS
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50 w-1/3">Creative Identifier:</td>
                          <td className="p-2.5 font-semibold text-gray-900">{printableCertificate.title}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Campaign & Client:</td>
                          <td className="p-2.5">
                            {printableCertificate.campaignName} ({printableCertificate.clientCompanyName})
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Target Billboard Face:</td>
                          <td className="p-2.5">
                            {printableCertificate.billboardCode} — {printableCertificate.billboardName} (
                            {printableCertificate.billboardCity})
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-bold bg-gray-50">Format & Dimensions:</td>
                          <td className="p-2.5">
                            {FORMAT_CONFIG[printableCertificate.format].label} (
                            {printableCertificate.revisions[printableCertificate.revisions.length - 1]?.dimensions})
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold bg-gray-50">Color Space & Density:</td>
                          <td className="p-2.5 font-semibold text-emerald-700">
                            {printableCertificate.revisions[printableCertificate.revisions.length - 1]?.colorSpace} •{' '}
                            {printableCertificate.revisions[printableCertificate.revisions.length - 1]?.resolutionDpi} DPI
                            (Certified Preflight Passed)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Visual Proof Thumbnail */}
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                    2. VERIFIED VISUAL PROOF (v{printableCertificate.currentVersion})
                  </h2>
                  <div className="border border-gray-300 rounded-lg p-2 bg-gray-950 flex items-center justify-center max-h-72 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        printableCertificate.revisions[printableCertificate.revisions.length - 1]?.fileUrl
                      }
                      alt={printableCertificate.title}
                      className="max-h-64 w-auto object-contain rounded"
                    />
                  </div>
                </div>

                {/* Section 3: Client Sign-Off & Audit */}
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    3. CLIENT ENDORSEMENT & CRYPTOGRAPHIC SEAL
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Authorized Signatory:</div>
                      <div className="font-serif italic text-2xl text-emerald-950 mt-1">
                        {printableCertificate.approvalAudit[0]?.approvedBy || 'David Sterling'}
                      </div>
                      <div className="font-bold text-gray-900 mt-1">
                        {printableCertificate.approvalAudit[0]?.approvedBy || 'David Sterling'}
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        {printableCertificate.approvalAudit[0]?.approverRole || 'Chief Executive Officer'}
                      </div>
                      <div className="text-gray-400 font-mono text-[9px] mt-1">
                        Timestamp: {printableCertificate.approvalAudit[0]?.approvedAt || '2026-09-28 10:15:33'}
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 text-center flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-xs">PRE-FLIGHT VERIFIED SEAL</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">SHA-256 Cryptographic Hash</div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold mt-2">
                          {printableCertificate.approvalAudit[0]?.signatureHash || 'SHA-256-9A8B7C6D5E4F3A2B1C0D'}
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 pt-2 border-t border-gray-200">
                        IP Address: {printableCertificate.approvalAudit[0]?.ipAddress || '12.180.44.102'} • Adversoft
                        QA Bureau
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
