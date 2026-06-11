import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Contact | Jol Energy",
};

const CONTACT_EMAIL = "rohithpranovv@gmail.com";

export default function ContactPage() {
  return (
    <LegalLayout title="Contact us">
      <p>
        Jol Energy Pvt. Ltd. builds the circular supply chain for end-of-life
        Li-ion batteries — recovering critical metals and returning them to the
        battery value chain. Whether you&rsquo;re a scrap supplier, an offtake
        buyer, or just curious about the platform, we&rsquo;d love to hear from
        you.
      </p>

      <h2>Email</h2>
      <p>
        The fastest way to reach us is by email — we typically reply within a
        couple of working days.
      </p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Jol%20Energy%20enquiry`}>
          {CONTACT_EMAIL}
        </a>
      </p>

      <h2>Partnerships</h2>
      <ul>
        <li>
          <strong>Suppliers</strong> — battery scrap, collection points, and
          aggregators across South India.
        </li>
        <li>
          <strong>Buyers</strong> — recovered metal-salt offtake (NiSO₄, CoSO₄,
          Li₂CO₃, and more).
        </li>
        <li>
          <strong>Collection network</strong> — hub cities in Chennai,
          Bengaluru, and Hyderabad.
        </li>
      </ul>

      <h2>Operating region</h2>
      <p>
        South India, with collection and logistics hubs centred on Chennai,
        Bengaluru, and Hyderabad.
      </p>

      <p>
        <em>
          Note: this Platform is a demonstration / evaluation project. Please
          use the email above for any enquiry.
        </em>
      </p>
    </LegalLayout>
  );
}
