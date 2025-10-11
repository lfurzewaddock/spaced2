import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { constructImageMarkdownLink } from "@/lib/files/upload";
import { CachedImage, imagePersistedDb, isCachedImage } from "@/lib/images/db";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useLiveQuery } from "dexie-react-hooks";
import { Image } from "lucide-react";
import { toast } from "sonner";

type ImagePickerResponsiveProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ImageGrid({
  onImageSelect,
}: {
  onImageSelect: (image: CachedImage) => void;
}) {
  const images = useLiveQuery(
    () =>
      imagePersistedDb.images.orderBy("cachedAt").reverse().limit(20).toArray(),
    [],
    [],
  );

  // Filter for cached images only
  const recentImages = (images || []).filter(isCachedImage) as CachedImage[];
  if (recentImages.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto p-0.5">
      {recentImages.map((image) => {
        const url = URL.createObjectURL(image.thumbnail);
        return (
          <img
            key={image.url}
            src={url}
            alt={image.altText || "cached image"}
            className="rounded-sm shadow-sm w-full h-full object-cover hover:outline hover:outline-ring transition-all duration-150 cursor-pointer aspect-square"
            onClick={() => onImageSelect(image)}
          />
        );
      })}
    </div>
  );
}

export default function ImagePickerResponsive({
  open,
  onOpenChange,
}: ImagePickerResponsiveProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleImageSelect = async (image: CachedImage) => {
    // Extract the file key from the URL
    // URL format: {BACKEND_URL}/files/{fileKey}
    const urlParts = image.url.split("/files/");
    const fileKey = urlParts[1];

    if (!fileKey) {
      toast.error("Invalid image URL");
      return;
    }

    const imageMarkdown = constructImageMarkdownLink(fileKey, image.altText);
    await navigator.clipboard.writeText(imageMarkdown);

    toast("Image URL copied to clipboard!", {
      icon: <Image className="w-4 h-4" />,
    });

    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <ImageGrid onImageSelect={handleImageSelect} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recent images</DialogTitle>
        </DialogHeader>
        <ImageGrid onImageSelect={handleImageSelect} />
      </DialogContent>
    </Dialog>
  );
}
