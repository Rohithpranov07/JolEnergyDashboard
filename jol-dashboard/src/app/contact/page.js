import { Clock, Mail, MapPin, Phone } from "lucide-react";
import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Contact | Jol Energy",
};

const EMAIL = "jolenergy.x@gmail.com";
const PHONE_DISPLAY = "+91 90251 08037";
const PHONE_TEL = "+919025108037";

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="glass-card p-5">
      <span
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: "rgba(10,120,100,0.12)", color: "#0A7864" }}
      >
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h2>
      <div className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <LegalLayout title="Get in touch" bare>
      <p className="-mt-2 mb-6 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
        Jol Energy Pvt. Ltd. builds the circular supply chain for end-of-life
        Li-ion batteries. Whether you&rsquo;re a scrap supplier, an offtake
        buyer, or have a question about the platform, reach out through any of
        these channels.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard icon={MapPin} title="Office address">
          <p className="font-semibold text-[var(--text-primary)]">
            Registered office
          </p>
          <p className="mt-0.5">
            Jol Energy Private Limited
            <br />
            1/135C, Thekkala Thottam, Vellai Goundanpudhur,
            <br />
            Uttukuli, Perundurai, Erode — 638751
            <br />
            Tamil Nadu, India
          </p>
          <p className="mt-3 font-semibold text-[var(--text-primary)]">
            Incubated at
          </p>
          <p className="mt-0.5">
            014, Technology Tower,
            <br />
            Vellore Institute of Technology,
            <br />
            Katpadi, Vellore, Tamil Nadu, India
          </p>
        </InfoCard>

        <div className="flex flex-col gap-4">
          <InfoCard icon={Phone} title="Phone">
            <a
              href={`tel:${PHONE_TEL}`}
              className="font-semibold text-[#0A7864] hover:underline"
            >
              {PHONE_DISPLAY}
            </a>
            <p className="mt-0.5 text-[var(--text-muted)]">
              Mon–Fri · 9:00 AM – 6:00 PM IST
            </p>
          </InfoCard>

          <InfoCard icon={Mail} title="Email">
            <a
              href={`mailto:${EMAIL}?subject=Jol%20Energy%20enquiry`}
              className="font-semibold text-[#0A7864] hover:underline"
            >
              {EMAIL}
            </a>
            <p className="mt-0.5 text-[var(--text-muted)]">
              We respond within 24 hours.
            </p>
          </InfoCard>

          <InfoCard icon={Clock} title="Business hours">
            Monday – Friday
            <br />
            9:00 AM – 6:00 PM IST
          </InfoCard>
        </div>
      </div>

      <p className="mt-6 text-[12px] italic text-[var(--text-muted)]">
        Note: the dashboard itself is a demonstration / evaluation project.
      </p>
    </LegalLayout>
  );
}
