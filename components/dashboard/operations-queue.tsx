"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  Palette,
  FileText,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface PriorityTask {
  id: string;
  title: string;
  category: 'Artwork' | 'Installation' | 'Maintenance' | 'Billing';
  dueDate: string;
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
  description: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

export function OperationsQueue() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<PriorityTask[]>([
    {
      id: 't1',
      title: 'Artwork Review: Horizon 5G Creative V3',
      category: 'Artwork',
      dueDate: 'Today at 3:00 PM',
      urgency: 'HIGH',
      description: 'Sunset Wallscape (BB-104) flight scheduled for Oct 1st. Client revision waiting review.',
      link: '/artwork',
      icon: Palette,
      completed: false,
    },
    {
      id: 't2',
      title: 'Crew Alpha: Mount Vinyl on Unipole UP-22',
      category: 'Installation',
      dueDate: 'Tomorrow at 8:00 AM',
      urgency: 'HIGH',
      description: 'Acme NextGen Phone flight commencement. Vinyl received from print vendor.',
      link: '/installations',
      icon: Wrench,
      completed: false,
    },
    {
      id: 't3',
      title: 'Resolve Floodlight Outage on BB-105',
      category: 'Maintenance',
      dueDate: 'Sep 28, 2026',
      urgency: 'MEDIUM',
      description: 'South face lower LED floodlight ballast failed. Technician Carlos Santana dispatched.',
      link: '/maintenance',
      icon: AlertTriangle,
      completed: false,
    },
    {
      id: 't4',
      title: 'Follow Up: Invoice #INV-2026-003 ($22k)',
      category: 'Billing',
      dueDate: 'Oct 20, 2026',
      urgency: 'NORMAL',
      description: 'Advance billing sent to Horizon Telecom accounts payable department.',
      link: '/invoices',
      icon: CreditCard,
      completed: false,
    },
  ]);

  const toggleTask = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newState = !t.completed;
          if (newState) {
            toast.success('Task Acknowledged', `"${t.title}" marked completed.`);
          }
          return { ...t, completed: newState };
        }
        return t;
      })
    );
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Priority Operations Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Scheduled field installations, urgent sign-offs, and critical issues
              </CardDescription>
            </div>
          </div>
          <Badge variant="warning" className="text-xs">
            {pendingCount} Pending Action
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 divide-y divide-gray-100">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className={`py-3 first:pt-0 last:pb-0 transition-opacity ${
                task.completed ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => toggleTask(task.id, e)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50'
                  }`}
                  aria-label="Toggle task completion"
                >
                  {task.completed && <CheckCircle2 className="h-4 w-4" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <Badge
                      variant={
                        task.urgency === 'HIGH'
                          ? 'destructive'
                          : task.urgency === 'MEDIUM'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px] py-0"
                    >
                      {task.dueDate}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {task.category}
                    </span>
                    <Link
                      href={task.link}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
