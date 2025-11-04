'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

export function DashboardCard({ title, value, icon, color, description }: DashboardCardProps) {
  const header = (
    <div className="flex items-center justify-content-between mb-3">
      <div className="flex items-center gap-2">
        <i className={`${icon} text-2xl`} style={{ color }}></i>
        <span className="font-semibold text-lg">{title}</span>
      </div>
      <Badge value={value} severity={value > 0 ? "success" : "secondary"} />
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <Button 
        label="View Details" 
        icon="pi pi-arrow-right" 
        size="small"
        text
        className="p-0"
      />
    </div>
  );

  return (
    <Card 
      header={header}
      footer={footer}
      className="h-full"
    >
      <div className="text-center py-4">
        <div className="text-4xl font-bold mb-2" style={{ color }}>
          {value}
        </div>
        {description && (
          <>
            <Divider />
            <p className="text-sm text-600 m-0">{description}</p>
          </>
        )}
      </div>
    </Card>
  );
}