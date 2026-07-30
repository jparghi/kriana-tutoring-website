import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "../../../components/footer";
import { breadcrumbSchema, localBusinessSchema, siteUrl, toJsonLd } from "../../../lib/seo";
import { getServicePageBySlug, servicePages } from "../data";

type ServiceDetailPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: ServiceDetailPageProps): Metadata {
  const service = getServicePageBySlug(params.slug);

  if (!service) {
    return {
      title: "Service Not Found",
      description: "The requested service page could not be found."
    };
  }

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: `${siteUrl}/services/${service.slug}` }
  };
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = getServicePageBySlug(params.slug);

  if (!service) {
    notFound();
  }

  const serviceBreadcrumb = breadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Services", url: `${siteUrl}/services` },
    { name: service.shortTitle, url: `${siteUrl}/services/${service.slug}` }
  ]);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: {
      "@id": localBusinessSchema["@id"]
    },
    areaServed: ["Ottawa", "Kanata", "Stittsville"],
    serviceType: service.shortTitle,
    url: `${siteUrl}/services/${service.slug}`
  };

  return (
    <>
      <main className="min-h-screen bg-white px-6 pb-20 pt-10 sm:px-10 lg:pt-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(serviceBreadcrumb) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(serviceSchema) }}
        />
        <div className="mx-auto max-w-6xl">
          <Link
            href="/services"
            className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.18em] text-[#0A5B8C] hover:text-[#0A2D5A]"
          >
            ← Back to Services
          </Link>

          <section className="mt-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,249,255,0.92),rgba(255,247,237,0.9))] shadow-[0_20px_60px_rgba(6,11,26,0.08)]">
            <div className="grid items-center lg:grid-cols-[1fr_0.9fr]">
              <div className="px-8 py-10 lg:px-12 lg:py-14">
                <p className="inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#0A5B8C] ring-1 ring-[#D3E8F5]">
                  Personalized JK–Grade 8 Support
                </p>
                <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#0A2D5A] sm:text-5xl">
                  {service.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{service.intro}</p>
                <Link
                  href="/contact#consultation-form"
                  className="mt-7 inline-flex items-center justify-center rounded-full bg-[#0c6162] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0a5051]"
                >
                  Book a Free Assessment
                </Link>
              </div>
              <div className="relative aspect-[16/10] min-h-72 overflow-hidden bg-white lg:h-full lg:min-h-[430px]">
                <Image src={service.image} alt={service.imageAlt} fill priority className="object-cover" />
                <span className="absolute inset-y-0 left-0 hidden w-1 lg:block" style={{ backgroundColor: service.accent }} />
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {service.sections.map((section) => (
              <article key={section.title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                <h2 className="text-2xl font-semibold text-[#0A2D5A]">{section.title}</h2>
                <p className="mt-4 text-base leading-8 text-slate-600">{section.description}</p>
              </article>
            ))}
          </section>

          <section className="mt-10 rounded-[2rem] bg-[#0A2D5A] px-8 py-10 text-white">
            <h2 className="text-2xl font-semibold">Serving Ottawa, Kanata, and nearby communities</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">
              Kriana Tutoring helps families who want structured academic support, clear communication, and a
              confidence-building approach for children in JK to Grade 8.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact#consultation-form"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0A2D5A]"
              >
                Book a Free Assessment
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
              >
                Read Parent Resources
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
