import LayoutComp from "../components/LayoutComp";
import Sidebar from "../components/Sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* <LayoutComp mainHeader={"Dashboard"}> */}
        {children}
      {/* </LayoutComp> */}
    </div>
  );
}