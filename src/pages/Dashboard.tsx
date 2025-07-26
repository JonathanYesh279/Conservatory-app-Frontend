import { Header } from "../cmps/Header";
import { BottomNavbar } from "../cmps/BottomNavbar";

export function Dashboard() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <h1>Dashboard</h1>
      </main>
      <BottomNavbar />
    </div>
  )
}