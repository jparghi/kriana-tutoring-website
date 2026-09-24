import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CameraIcon,
  MapPinIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Footer } from "../../components/footer";
import { GalleryVideo } from "../../components/gallery/gallery-video";
import { getGalleryVideos } from "../../lib/gallery.server";
import { ASSESSMENT_BOOKING_URL, ROBOTICS_PATH } from "../../lib/site-links";
import { breadcrumbSchema, siteUrl, toJsonLd } from "../../lib/seo";

const { spotlight, more } = getGalleryVideos();

export const metadata: Metadata = {
  title: "Gallery | See Young Engineers in Action",
  description:
    "Real builds. Real learning. Real hands-on engineering. Watch Young Engineers in action at Kriana Tutoring in Kanata, including our Bricks Challenge carousel and demo highlights.",
  alternates: { canonical: `${siteUrl}/gallery` },
  openGraph: {
    title: "See Young Engineers in Action",
    description:
      "Real builds. Real learning. Real hands-on engineering. Young Engineers at Kriana Tutoring, Kanata.",
    url: `${siteUrl}/gallery`,
    ...(spotlight
      ? {
          images: [
            {
              url: spotlight.poster,
              width: spotlight.width,
              height: spotlight.height,
              alt: spotlight.alt,
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "See Young Engineers in Action",
    description: "Real builds. Real learning. Real hands-on engineering.",
    ...(spotlight ? { images: [spotlight.poster] } : {}),
  },
};

export default function GalleryPage() {
  return (
    <>
      <main className="min-h-screen bg-[#FFFEFA] text-[#0A2D5A]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(
              breadcrumbSchema([
                { name: "Home", url: siteUrl },
                { name: "Gallery", url: `${siteUrl}/gallery` },
              ]),
            ),
          }}
        />
        <section
          aria-labelledby="gallery-title"
          className="relative isolate overflow-hidden px-6 pb-12 pt-9 sm:px-10 lg:pb-16 lg:pt-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 top-20 -z-10 h-[38rem] w-[38rem] rounded-full bg-[#E8F1E9]/70 blur-3xl"
          />
          <div className="mx-auto max-w-6xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-9 flex items-center gap-2 text-xs text-slate-500 lg:mb-12"
            >
              <Link href="/" className="min-h-6 py-1 hover:text-[#0c6162]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-[#0c6162]">
                Gallery
              </span>
            </nav>
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0c6162]/15 bg-[#EDF4EA] px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#0c6162]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0c6162]" />{" "}
                Learning, in action
              </p>
              <h1
                id="gallery-title"
                className="mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl"
              >
                See Young Engineers{" "}
                <span className="whitespace-nowrap text-[#0c6162]">in Action</span>
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Real builds. Real learning. Real hands-on engineering.
              </p>
            </div>
            {spotlight && (
              <figure className="mx-auto mt-9 max-w-4xl lg:mt-12">
                <div className="rounded-[2rem] border border-white bg-white p-2 shadow-[0_24px_65px_-20px_rgba(10,45,90,0.28)]">
                  <GalleryVideo
                    media={spotlight}
                    priority
                    playLabel="Watch it in action"
                    sizes="(min-width: 1024px) 880px, calc(100vw - 64px)"
                  />
                </div>
                <figcaption className="mx-auto mt-6 max-w-xl text-center">
                  <h2 className="text-2xl font-semibold">{spotlight.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {spotlight.caption}
                  </p>
                </figcaption>
              </figure>
            )}
          </div>
        </section>

        {more.map((video, videoIndex) => (
        <section
          key={video.id}
          aria-labelledby={`more-title-${video.id}`}
          className="relative isolate overflow-hidden border-t border-[#E5EBE1] px-6 py-14 sm:px-10 lg:py-20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 top-20 -z-10 h-[38rem] w-[38rem] rounded-full bg-[#E8F1E9]/70 blur-3xl"
          />
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-x-20 lg:gap-y-0">
              <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#0c6162]/15 bg-[#EDF4EA] px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#0c6162]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0c6162]" />{" "}
                  Moments at Kriana
                </p>
                <h2
                  id={`more-title-${video.id}`}
                  className="mt-6 text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl"
                >
                  A little look
                  <br />
                  <span className="text-[#0c6162]">inside Kriana.</span>
                </h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
                  Curious minds, busy hands, and that proud{" "}
                  <span className="font-semibold text-[#0A2D5A]">
                    “I made this!”
                  </span>{" "}
                  moment.
                </p>
                <p className="mt-4 hidden max-w-md text-base leading-7 text-slate-600 sm:block">
                  Step into our world of busy hands, bright ideas, and happy
                  discoveries. Here’s a little of what learning together looks
                  like.
                </p>
                <div
                  className="mt-7 flex flex-wrap gap-2.5"
                  aria-label="Learning at Kriana"
                >
                  {["Build", "Explore", "Discover"].map((word, index) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E8E7DF] bg-white px-3.5 py-2 text-sm font-medium"
                    >
                      <span
                        className={`h-2 w-2 rounded-sm ${index === 0 ? "bg-[#E7AE47]" : index === 1 ? "bg-[#0c6162]" : "bg-[#4A90E2]"}`}
                        aria-hidden="true"
                      />
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              {video && (
                <figure
                  id={videoIndex === 0 ? "demo-highlight" : undefined}
                  className="relative mx-auto w-full max-w-[330px] scroll-mt-28 sm:max-w-[350px] lg:col-start-2 lg:row-span-2 lg:row-start-1"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -inset-x-4 -inset-y-3 -rotate-3 rounded-[2.25rem] bg-[#EEDDAF] sm:-inset-x-5"
                  />
                  <div className="relative rounded-[2rem] border border-white bg-white p-2 shadow-[0_24px_65px_-20px_rgba(10,45,90,0.28)]">
                    <GalleryVideo media={video} />
                  </div>
                  <figcaption className="relative mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#0c6162]">
                    <SparklesIcon className="h-4 w-4" />
                    Real moments. Really proud little builders.
                  </figcaption>
                </figure>
              )}
              <div className="max-w-md border-t border-[#DBE4DA] pt-6 lg:col-start-1 lg:row-start-2 lg:mt-9 lg:self-start">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#0c6162]">
                  Featured moment
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  {video?.title ?? "More discoveries on the way"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {video?.caption ??
                    "We’re gathering moments from our learning space. Check back soon."}
                </p>
                {video?.event && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4 w-4 text-[#0c6162]" />
                      <time dateTime={video.event.date}>
                        {new Intl.DateTimeFormat("en-CA", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(`${video.event.date}T12:00:00Z`))}
                      </time>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 text-[#0c6162]" />
                      {video.event.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        ))}

        <section
          aria-labelledby="coming-soon-title"
          className="border-y border-[#E5EBE1] bg-[#F3F6EF] px-6 py-9 sm:px-10"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#DCE5D7] bg-white text-[#0c6162]">
              <CameraIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 id="coming-soon-title" className="text-xl font-semibold">
                More of our world, coming soon.
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                We’ll be sharing photos of our learning centre, tutoring
                moments, and more hands-on adventures. There’s plenty more to
                see.
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-[#DCE5D7] px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#0c6162] sm:ml-auto">
              Our gallery is growing
            </span>
          </div>
        </section>

        <section
          aria-labelledby="visit-title"
          className="px-6 py-14 sm:px-10 lg:py-20"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-7 rounded-[2rem] bg-[#0A2D5A] px-7 py-10 text-white sm:px-12 lg:grid-cols-[1fr_auto] lg:gap-12">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#FFD166]">
                Your child’s next discovery starts here
              </p>
              <h2
                id="visit-title"
                className="mt-3 text-3xl font-semibold sm:text-4xl"
              >
                Come see Kriana for yourself.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
                Personalized academic support and hands-on STEM learning, in a
                welcoming space where children can grow in confidence.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={ASSESSMENT_BOOKING_URL}
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#FFD166] px-6 py-3 text-center text-sm font-bold text-[#0A2D5A] transition hover:bg-[#FFE09A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Book a Free Academic Assessment
                <ArrowRightIcon className="h-4 w-4 shrink-0" />
              </Link>
              <Link
                href={ROBOTICS_PATH}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Explore Robotics Programs
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
