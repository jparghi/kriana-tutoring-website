import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "@heroicons/react/24/solid";
import { getPublicGalleryMedia } from "../../lib/gallery.server";
import { GALLERY_PATH } from "../../lib/site-links";

export function GalleryPreview() {
  const collection = getPublicGalleryMedia();
  const media = collection.find((item) => item.featured) ?? collection[0];
  if (!media) return null;

  return (
    <section
      aria-labelledby="gallery-preview-title"
      className="px-6 py-10 sm:px-10"
    >
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[#E5EBE7] bg-[#F5F8F4]">
        <div className="grid sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
          <Link
            href={GALLERY_PATH}
            aria-label="Visit the Kriana gallery"
            className="group relative block h-56 overflow-hidden bg-[#0A2D5A] sm:h-full sm:min-h-64 focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-[#0c6162]"
          >
            <Image
              src={media.type === "video" ? media.poster : media.thumbnail}
              alt={media.alt}
              width={media.width}
              height={media.height}
              className="h-full w-full object-cover object-[center_35%] transition-transform duration-500 motion-safe:group-hover:scale-105"
            />
            {media.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-[#0A2D5A]/15">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#0c6162] shadow-lg">
                  <PlayIcon className="ml-0.5 h-6 w-6" />
                </span>
              </span>
            )}
          </Link>
          <div className="flex flex-col justify-center px-7 py-8 sm:px-10 lg:px-14">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#0c6162]">
              Moments at Kriana
            </p>
            <h2
              id="gallery-preview-title"
              className="mt-3 text-3xl font-semibold leading-tight text-[#0A2D5A] sm:text-4xl"
            >
              A little look inside our world.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Curious minds, busy hands, and the joy of figuring things out. See
              our Young Engineers demo in action.
            </p>
            <Link
              href={GALLERY_PATH}
              className="mt-5 inline-flex min-h-11 w-fit items-center gap-3 text-sm font-bold text-[#0c6162] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c6162]"
            >
              Take a look inside <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
