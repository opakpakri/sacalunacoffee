import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/owner/UsersPage";
import MenusPage from "./pages/owner/MenusPage";
import AddMenusPage from "./pages/owner/AddMenusPage";
import EditMenusPage from "./pages/owner/EditMenusPage";
import HistorysPage from "./pages/owner/HistorysPage";
import BlogsPage from "./pages/owner/BlogsPage";
import AddBlogsPage from "./pages/owner/AddBlogsPage";
import EditBlogsPage from "./pages/owner/EditBlogsPage";
import AddUsersPage from "./pages/owner/AddUsersPage";
import EditUsersPage from "./pages/owner/EditUsersPage";
import TransactionsPageKitchen from "./pages/kitchen/TransactionsPage";
import TransactionsPageCashier from "./pages/cashier/TransactionsPage";
import BarcodesPageCashier from "./pages/cashier/BarcodesPage";
import AddBarcodesPageCashier from "./pages/cashier/AddBarcodesPage";
import EditBarcodesPageCashier from "./pages/cashier/EditBarcodesPage";
import InvoiceOrdersPage from "./pages/cashier/InvoiceOrdersPage";
import StockMenusPage from "./pages/kitchen/StockMenusPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/add-user" element={<AddUsersPage />} />
        <Route path="/users/edit-user/:id" element={<EditUsersPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/menus/add-menu" element={<AddMenusPage />} />
        <Route path="/menus/edit-menu/:id" element={<EditMenusPage />} />
        <Route path="/historys" element={<HistorysPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/add-blog" element={<AddBlogsPage />} />
        <Route path="/blogs/edit-blog/:id" element={<EditBlogsPage />} />
        <Route
          path="/transactionsKitchen"
          element={<TransactionsPageKitchen />}
        />
        <Route path="/stockMenus" element={<StockMenusPage />} />
        <Route
          path="/transactionsCashier"
          element={<TransactionsPageCashier />}
        />
        <Route
          path="/transactionsCashier/invoice"
          element={<InvoiceOrdersPage />}
        />

        <Route path="/barcodeCashier" element={<BarcodesPageCashier />} />
        <Route
          path="/barcodeCashier/add-table"
          element={<AddBarcodesPageCashier />}
        />
        <Route
          path="/barcodeCashier/edit-table/:id"
          element={<EditBarcodesPageCashier />}
        />
      </Routes>
    </Router>
  );
}

export default App;
