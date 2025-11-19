import { Outlet, Route, Routes, useParams } from "react-router-dom";
import StorefrontPreviewPage from "./pages/lab_management/storefront_preview/StorefrontPreviewPage";
import TrainingModulesPage from "./pages/lab_management/training_modules/TrainingModulesPage";
import InventoryPage from "./pages/lab_management/inventory/InventoryPage";
import ManageRoomPage from "./pages/makerspace_page/MonitorRoomPage";
import StorefrontPage from "./pages/lab_management/storefront/StorefrontPage";
import TrainingPage from "./pages/maker/training/TrainingPage";
import UsersPage from "./pages/lab_management/users/UsersPage";
import AuditLogsPage from "./pages/lab_management/audit_logs/AuditLogsPage";
import InventoryPreviewPage from "./pages/maker/inventory_preview/InventoryPreviewPage";
import SignupPage from "./pages/maker/signup/SignupPage";
import QuizPage from "./pages/maker/take_quiz/QuizPage";
import QuizResults from "./pages/maker/take_quiz/QuizResults";
import AnnouncementsPage from "./pages/lab_management/announcements/AnnouncementsPage";
import NotFoundPage from "./pages/NotFoundPage";
import EditActiveModulePage from "./pages/lab_management/edit_module/EditActiveModulePage";
import LogoutPromptPage from "./pages/both/logout/LogoutPromptPage";
import NewModulePage from "./pages/lab_management/edit_module/NewModulePage";
import NewAnnouncementPage from "./pages/lab_management/announcements/NewAnnouncementPage";
import EditAnnouncement from "./pages/lab_management/announcements/EditAnnouncement";
import ReadersPage from "./pages/lab_management/readers/ReadersPage";
import EditTermsPage from "./pages/lab_management/policy/EditTermsPage";
import TermsPage from "./pages/both/policy/TermsPage";
import ResolutionLogPage from "./pages/lab_management/manage_equipment/ResolutionLog";
import { Dashboard } from "./pages/both/homepage/Dashboard";
import { ToolItemPage } from "./pages/lab_management/inventory/ToolItemPage";
import UserSettingsPage from "./pages/both/user_page/user_settings/UserSettingsPage";
import UserTraingingsPage from "./pages/both/user_page/user_trainings/UserTrainingsPage";
import TopNav from "./top_nav/TopNav";
import MakerspacePage from "./pages/makerspace_page/MakerspacePage";
import NewReaderPage from "./pages/newreaderpage/NewReaderPage";
import ManageMakerspacePage from "./pages/makerspace_page/ManageMakerspacePage";
import { useCurrentUser } from "./common/CurrentUserProvider";
import StaffBar from "./pages/makerspace_page/StaffBar";
import { isAdmin, isManagerFor, isOnlyTrainer, isStaffFor } from "./common/PrivilegeUtils";
import NoPrivilegePage from "./pages/NoPrivilegePage";
import AnnouncementsDisplay from "./pages/signage/AnnouncementsDisplay";
import HoursDisplay from "./pages/signage/HoursDisplay";
import EventsDisplay from "./pages/signage/EventsDisplay";
import { CartListPage } from "./pages/lab_management/storefront/internal/CartListPage";
import { CartPage } from "./pages/lab_management/storefront/internal/CartPage";
import CurrencyPage from "./pages/lab_management/currency/CurrencyPage";
import OrganizationsPage from "./pages/lab_management/organizations/OrganizationsPage";
import SiteSettingsPage from "./pages/site-settings/SiteSettingsPage";
import { Slide, ToastContainer } from "react-toastify";
import EditEquipmentPage from "./pages/makerspace_page/equipment_pages/EditEquipmentPage";
import NewEquipmentPage from "./pages/makerspace_page/equipment_pages/NewEquipmentPage";
import EquipmentRedirector from "./pages/makerspace_page/equipment_pages/EquipmentRedirector";
import HelpPage from "./pages/maker/signup/HelpPage";
import UserPage from "./pages/lab_management/users/UserPage";

// This is where we map the browser's URL to a
// React component with the help of React Router.

// Authed Routes
function AuthedRoute() {
  const user = useCurrentUser();
  if (user.visitor) {
    window.location.replace(import.meta.env.VITE_LOGIN_URL ?? "/")
    return <></>;
  } else {
    return <Outlet />
  }
}

function TrainerRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isOnlyTrainer(user) || isStaffFor(user, Number(makerspaceID))) {
    return <Outlet />
  } else {
    return <NoPrivilegePage />
  }
}

function StaffRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isStaffFor(user, Number(makerspaceID))) {
    return <Outlet />
  } else {
    return <NoPrivilegePage />
  }
}

function ManagerRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isManagerFor(user, Number(makerspaceID))) {
    return <Outlet />
  } else {
    return <NoPrivilegePage />
  }
}

function AdminRoute() {
  const user = useCurrentUser();
  if (isAdmin(user)) {
    return <Outlet />
  } else {
    return <NoPrivilegePage />
  }
}

export default function AppRoutes() {
  return (
    <div className="app">

      <Routes>

        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/storefront/preview" element={<StorefrontPreviewPage />} />

        {/* Routes for the sattic displays around the makerspaces */}
        <Route path="/display">
          <Route path="/display/announcements" element={<AnnouncementsDisplay />} />
          <Route path="/display/hours/:makerspaceID" element={<HoursDisplay />} />
          <Route path="/display/events" element={<EventsDisplay />} />
        </Route>
        {/* END STATIC DISPLAYS */}

        <Route path={"/"} element={<TopNav />}>

          <Route path="/" element={<Dashboard />} />
          <Route path="/makerspace/:makerspaceID" element={<MakerspacePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/storefront" element={<StorefrontPage />} />

          {/* Routes that need to be protected by auth */}
          <Route element={<AuthedRoute />}>
            <Route path="/user/trainings" element={<UserTraingingsPage />} />
            <Route path="/user/settings" element={<UserSettingsPage />} />

            <Route path="/equipment/:equipmentID" element={<EquipmentRedirector />} />

            {/* Routes for trainers + higher */}
            <Route>
              <Route path="/makerspace/:makerspaceID" element={<StaffBar />}>

                <Route path="/makerspace/:makerspaceID/people" element={<UsersPage />} />
                <Route path="/makerspace/:makerspaceID/people/:userID" element={<UserPage/>} />
                <Route path="/makerspace/:makerspaceID/inventory" element={<InventoryPage />} />
                <Route path="/makerspace/:makerspaceID/storefront/carts" element={<CartListPage />} />
                <Route path="/makerspace/:makerspaceID/storefront/carts/:cartID" element={<CartPage />} />

                {/* Routes for staff + higher */}
                <Route element={<StaffRoute />}>
                  <Route path="/makerspace/:makerspaceID/trainings" element={<TrainingModulesPage />} />
                  <Route path="/makerspace/:makerspaceID/training/new" element={<NewModulePage />} />
                  <Route path="/makerspace/:makerspaceID/training/:id" element={<EditActiveModulePage />} />

                  <Route path="/makerspace/:makerspaceID/equipment/new" element={<NewEquipmentPage />} />
                  <Route path="/makerspace/:makerspaceID/equipment/:equipmentID" element={<EditEquipmentPage />} />

                  <Route path="/makerspace/:makerspaceID/tools" element={<ToolItemPage />} />
                  <Route path="/makerspace/:makerspaceID/tools/type/:typeid" element={<ToolItemPage />} />
                  <Route path="/makerspace/:makerspaceID/tools/type/" element={<ToolItemPage />} />
                  <Route path="/makerspace/:makerspaceID/tools/instance/:instanceid" element={<ToolItemPage />} />
                  <Route path="/makerspace/:makerspaceID/tools/instance/" element={<ToolItemPage />} />

                  <Route path="/makerspace/:makerspaceID/history" element={<AuditLogsPage />} />
                  <Route path="/makerspace/:makerspaceID/organizations" element={<OrganizationsPage />} />

                  {/* Routes for manager + higher */}
                  <Route element={<ManagerRoute />}>
                    <Route path="/makerspace/:makerspaceID/readers" element={<ReadersPage />} />
                    <Route path="/makerspace/:makerspaceID/edit" element={<ManageMakerspacePage />} />
                    <Route path="/makerspace/:makerspaceID/edit/room/:roomID" element={<ManageRoomPage />} />
                    <Route path="/makerspace/:makerspaceID/currency" element={<CurrencyPage />} />
                  </Route>
                  {/* End manager routes */}

                </Route>
              </Route>
            </Route>

            {/* Routes for admins */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/announcements" element={<AnnouncementsPage />} />
              <Route path="/admin/announcements/:id" element={<EditAnnouncement />} />
              <Route path="/admin/announcements/new" element={<NewAnnouncementPage />} />

              <Route path="/admin/newreader" element={<NewReaderPage />} />
              <Route path="/admin/settings" element={<SiteSettingsPage />} />
            </Route>

            <Route path="/maker/training" element={<TrainingPage />} />
            <Route path="/maker/training/:id" element={<QuizPage />} />
            <Route path="/maker/training/:id/results" element={<QuizResults />} />
            <Route path="/maker/training/:id/results/:submissionID" element={<QuizResults />} />

            <Route path="/maker/materials" element={<InventoryPreviewPage />} />

            <Route path="/admin/equipment/logs/:logid" element={<ResolutionLogPage />} />

            <Route path="/admin/inventory" element={<InventoryPage />} />

            <Route path="/admin/terms" element={<EditTermsPage />} />
          </Route>
          {/* END OF PROTECTED ROUTES */}

          <Route path="/storefront" element={<StorefrontPage />} />

          <Route path="/logoutprompt" element={<LogoutPromptPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ToastContainer
        position="bottom-left"
        transition={Slide}
      />
    </div>
  );
}