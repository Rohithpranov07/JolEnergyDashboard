import Dashboard from "../../components/Dashboard.jsx";
import RequireAuth from "../../components/RequireAuth.jsx";

export const metadata = {
  title: "Dashboard | Jol Energy",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
