'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { track } from '@/lib/analytics';

interface ComparePairCardLinkProps {
  href: string;
  slug: string;
  label: string;
  archLine: string;
}

export function ComparePairCardLink({ href, slug, label, archLine }: ComparePairCardLinkProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-xl border border-border bg-background/20 backdrop-blur-[2px] p-5 transition-all duration-200 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5 hover:scale-[1.01]"
      onClick={() => track('compare_index_pair_clicked', { slug, label })}
    >
      <div className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-brand/60 transition-all duration-200 group-hover:bg-brand group-hover:inset-y-2" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight group-hover:text-brand transition-colors duration-200">
            {label}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{archLine}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
    </Link>
  );
}
