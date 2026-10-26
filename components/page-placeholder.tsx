"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast';
import { ChevronRight, ArrowLeft, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  moduleCode?: string;
  description: string;
  features: string[];
  entityConnectors?: string[];
  stats?: { label: string; value: string }[];
}

export default function PagePlaceholder({
  title,
  moduleCode = 'MOD-ACTIVE',
  description,
  features,
  entityConnectors = [],
  stats = [],
}: PagePlaceholderProps) {
  const { toast } = useToast();

  const handleTestNotification = () => {
    toast.info(
      `${title} Module`,
      `Module ${moduleCode} operational. Enterprise cluster active.`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-gray-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-semibold">{title}</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {title}
            </h1>
            <Badge variant="default" className="text-xs">
              {moduleCode}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Button size="sm" onClick={handleTestNotification} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Operational Status</span>
          </Button>
        </div>
      </div>

      {/* Planned Metrics / KPI Preview */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-4">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600">
                <Clock className="h-3 w-3" />
                <span>Active Target</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Roadmap & Feature Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Capabilities */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Planned Module Capabilities</CardTitle>
              <Badge variant="secondary">Adversoft Spec</Badge>
            </div>
            <CardDescription>
              Architectural capabilities designed for {moduleCode} in the Adversoft specification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 font-medium leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Relationship */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifecycle Connections</CardTitle>
            <CardDescription>
              Connected entities in the complete outdoor-advertising lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-indigo-50/80 p-3 text-xs text-indigo-900 leading-relaxed font-medium border border-indigo-100">
              Client → Booking → Billboard → Campaign → Artwork → Installation → Invoice
            </div>

            {entityConnectors.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold text-gray-700">Connected to:</p>
                <div className="flex flex-wrap gap-1.5">
                  {entityConnectors.map((c, idx) => (
                    <Badge key={idx} variant="outline" className="text-[11px] bg-white">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
