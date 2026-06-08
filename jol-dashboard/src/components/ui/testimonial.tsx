"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef } from "react";

function ClientFeedback() {
  const testimonialRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <main className="w-full bg-white">
      <section
        className="relative h-full container text-black mx-auto rounded-lg py-14 bg-white"
        ref={testimonialRef}
      >
        <article className="max-w-screen-md mx-auto text-center space-y-2">
          <TimelineContent
            as="h1"
            className="xl:text-4xl text-3xl font-medium text-slate-900"
            animationNum={0}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            Every number traces back to a source
          </TimelineContent>
          <TimelineContent
            as="p"
            className="mx-auto text-gray-500"
            animationNum={1}
            customVariants={revealVariants}
            timelineRef={testimonialRef}
          >
            Real data from government registries, verified suppliers, and live market feeds — not AI-generated estimates
          </TimelineContent>
        </article>

        <div className="lg:grid lg:grid-cols-3 gap-2 flex flex-col w-full lg:py-10 pt-10 pb-4 lg:px-10 px-4">
          {/* Column 1 */}
          <div className="md:flex lg:flex-col lg:space-y-2 h-full lg:gap-0 gap-2">
            {/* TNPCB — large card */}
            <TimelineContent
              animationNum={0}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-slate-50 overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto relative z-10">
                <p className="text-slate-700 leading-relaxed">
                  &ldquo;15 supplier leads sourced directly from the TNPCB authorised
                  recycler list — each company name, phone, and address verified
                  against the official iwma.in PDF registry.&rdquo;
                </p>
                <div className="flex justify-between pt-5 items-center">
                  <div>
                    <h2 className="font-semibold lg:text-lg text-sm text-slate-900">
                      TNPCB Registry
                    </h2>
                    <p className="text-slate-500 text-sm">Tamil Nadu PCB · iwma.in</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    15
                  </div>
                </div>
              </article>
            </TimelineContent>

            {/* KSPCB */}
            <TimelineContent
              animationNum={1}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[3] flex-[4] lg:h-fit lg:shrink-0 flex flex-col justify-between relative bg-blue-600 text-white overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <article className="mt-auto">
                <p>
                  &ldquo;11 Karnataka leads cross-referenced with KSPCB authorised
                  e-waste recycler lists and verified via kspcb.gov.in.&rdquo;
                </p>
                <div className="flex justify-between pt-5 items-center">
                  <div>
                    <h2 className="font-semibold text-xl">KSPCB Registry</h2>
                    <p className="text-blue-100">Karnataka SPCB · kspcb.gov.in</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold shrink-0">
                    11
                  </div>
                </div>
              </article>
            </TimelineContent>
          </div>

          {/* Column 2 */}
          <div className="lg:h-full md:flex lg:flex-col h-fit lg:space-y-2 lg:gap-0 gap-2">
            {/* CPCB */}
            <TimelineContent
              animationNum={2}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  &ldquo;National e-waste recycler and dismantler entries pulled from
                  the CPCB registry at cpcb.nic.in — covering Telangana, AP, and
                  pan-India aggregators.&rdquo;
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">CPCB National</h2>
                    <p className="lg:text-base text-sm text-gray-400">cpcb.nic.in</p>
                  </div>
                  <div className="lg:w-14 lg:h-14 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold shrink-0">
                    8
                  </div>
                </div>
              </article>
            </TimelineContent>

            {/* IndiaMART */}
            <TimelineContent
              animationNum={3}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  &ldquo;Supplier and buyer leads validated through IndiaMART listings
                  — GST numbers confirmed, seller ratings checked, and listed
                  prices cross-referenced.&rdquo;
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">IndiaMART</h2>
                    <p className="lg:text-base text-sm text-gray-400">GST-verified sellers</p>
                  </div>
                  <div className="lg:w-14 lg:h-14 w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl font-bold shrink-0">
                    4
                  </div>
                </div>
              </article>
            </TimelineContent>

            {/* Market Prices */}
            <TimelineContent
              animationNum={4}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="flex flex-col justify-between relative bg-[#111111] text-white overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  &ldquo;Cobalt, Nickel, and Lithium Carbonate price anchors from
                  Trading Economics and SMM metal.com — USD/INR rate from
                  exchange-rates.org, Jun 2026.&rdquo;
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">Market Data</h2>
                    <p className="lg:text-base text-sm text-gray-400">
                      Trading Economics · SMM
                    </p>
                  </div>
                  <div className="lg:w-14 lg:h-14 w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 text-lg font-bold shrink-0">
                    30d
                  </div>
                </div>
              </article>
            </TimelineContent>
          </div>

          {/* Column 3 */}
          <div className="h-full md:flex lg:flex-col lg:space-y-2 lg:gap-0 gap-2">
            {/* Claude AI */}
            <TimelineContent
              animationNum={5}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[3] flex-[4] flex flex-col justify-between relative bg-blue-600 text-white overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <article className="mt-auto">
                <p>
                  &ldquo;AI insights powered by Claude API — pipeline health
                  narratives, city recommendations, and a live chat grounded in
                  real lead data.&rdquo;
                </p>
                <div className="flex justify-between pt-5 items-center">
                  <div>
                    <h2 className="font-semibold text-xl">Claude AI Engine</h2>
                    <p className="text-blue-100">claude-sonnet-4-20250514</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                </div>
              </article>
            </TimelineContent>

            {/* Collection Network — large card */}
            <TimelineContent
              animationNum={6}
              customVariants={revealVariants}
              timelineRef={testimonialRef}
              className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-slate-50 overflow-hidden rounded-lg border border-gray-200 p-5"
            >
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto relative z-10">
                <p className="text-slate-700 leading-relaxed">
                  &ldquo;32 collection points geo-mapped across South India — 17
                  verified via Google Maps lookup from published addresses. Three
                  hub cities (Chennai, Bengaluru, Hyderabad) with 80km radius
                  logistics overlay and cost-per-kg economics.&rdquo;
                </p>
                <div className="flex justify-between pt-5 items-center">
                  <div>
                    <h2 className="font-semibold text-xl text-slate-900">
                      Collection Network
                    </h2>
                    <p className="text-slate-500">
                      Google Maps · Saahas · PRO registries
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    32
                  </div>
                </div>
              </article>
            </TimelineContent>
          </div>
        </div>

        <div className="absolute border-b-2 border-[#e6e6e6] bottom-4 h-16 z-[2] md:w-full w-[90%] md:left-0 left-[5%]">
          <div className="container mx-auto w-full h-full relative before:absolute before:-left-2 before:-bottom-2 before:w-4 before:h-4 before:bg-white before:shadow-sm before:border border-gray-200 before:border-gray-300 after:absolute after:-right-2 after:-bottom-2 after:w-4 after:h-4 after:bg-white after:shadow-sm after:border after:border-gray-300"></div>
        </div>
      </section>
    </main>
  );
}

export default ClientFeedback;
