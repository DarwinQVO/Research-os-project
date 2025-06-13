'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceContent } from '@research-os/db/source';
import { QuotesCarousel } from './QuotesCarousel';
import { ImagesGrid } from './ImagesGrid';
import { EntitiesSection } from './EntitiesSection';

interface ContentTabsProps {
  content: SourceContent;
}

export function ContentTabs({ content }: ContentTabsProps) {
  const { quotes, images, entities } = content;

  return (
    <Tabs defaultValue="quotes" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-[#26262e] border-[#45caff]/20">
        <TabsTrigger 
          value="quotes" 
          className="text-[#a7b4c6] data-[state=active]:text-[#d4d4e1] data-[state=active]:bg-[#45caff]/10"
        >
          Quotes ({quotes.length})
        </TabsTrigger>
        <TabsTrigger 
          value="images" 
          className="text-[#a7b4c6] data-[state=active]:text-[#d4d4e1] data-[state=active]:bg-[#45caff]/10"
        >
          Images ({images.length})
        </TabsTrigger>
        <TabsTrigger 
          value="entities" 
          className="text-[#a7b4c6] data-[state=active]:text-[#d4d4e1] data-[state=active]:bg-[#45caff]/10"
        >
          Entities ({entities.length})
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-6">
        <TabsContent value="quotes" className="mt-0">
          <QuotesCarousel quotes={quotes} />
        </TabsContent>
        
        <TabsContent value="images" className="mt-0">
          <ImagesGrid images={images} />
        </TabsContent>
        
        <TabsContent value="entities" className="mt-0">
          <EntitiesSection entities={entities} />
        </TabsContent>
      </div>
    </Tabs>
  );
}