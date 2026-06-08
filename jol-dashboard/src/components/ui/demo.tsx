'use client';

import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from '@/components/ui/announcement';
import { ArrowUpRightIcon } from 'lucide-react';

const Example = () => (
  <div className="flex flex-col w-full h-screen items-center justify-center gap-4">

    <Announcement themed className="bg-sky-100 text-sky-700">
      <AnnouncementTag>Info</AnnouncementTag>
      <AnnouncementTitle>
        Welcome to the platform
        <ArrowUpRightIcon size={16} className="shrink-0 opacity-70" />
      </AnnouncementTitle>
    </Announcement>
  
  </div>
);

export { Example};
