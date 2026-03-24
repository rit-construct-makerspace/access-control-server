import { createBrowserRouter, Outlet, useParams } from "react-router-dom";
import { CurrentUserProvider, useCurrentUser } from "./common/CurrentUserProvider";
import { isAdmin, isManagerFor, isOnlyTrainer, isStaffFor } from "./common/PrivilegeUtils";
import NoPrivilegePage from "./pages/NoPrivilegePage";
import NotFoundPage from "./pages/NotFoundPage";
import { Dashboard } from "./pages/both/homepage/Dashboard";
import LogoutPromptPage from "./pages/both/logout/LogoutPromptPage";
import TermsPage from "./pages/both/policy/TermsPage";
import UserSettingsPage from "./pages/both/user_page/user_settings/UserSettingsPage";
import UserTraingingsPage from "./pages/both/user_page/user_trainings/UserTrainingsPage";
import StorefrontPage from "./pages/lab_management/storefront/StorefrontPage";
import StorefrontPreviewPage from "./pages/lab_management/storefront_preview/StorefrontPreviewPage";
import HelpPage from "./pages/maker/signup/HelpPage";
import SignupPage from "./pages/maker/signup/SignupPage";
import TrainingPage from "./pages/maker/training/TrainingPage";
import MakerspacePage from "./pages/makerspace_page/MakerspacePage";
import EquipmentRedirector from "./pages/makerspace_page/equipment_pages/EquipmentRedirector";
import AnnouncementsDisplay from "./pages/signage/AnnouncementsDisplay";
import EventsDisplay from "./pages/signage/EventsDisplay";
import HoursDisplay from "./pages/signage/HoursDisplay";
import TopNav from "./top_nav/TopNav";
import QuizPage from "./pages/maker/take_quiz/QuizPage";
import QuizResults from "./pages/maker/take_quiz/QuizResults";
import AdminInventoryPage from "./pages/lab_management/inventory/AdminInventoryPage";
import AnnouncementsPage from "./pages/lab_management/announcements/AnnouncementsPage";
import EditAnnouncement from "./pages/lab_management/announcements/EditAnnouncement";
import NewAnnouncementPage from "./pages/lab_management/announcements/NewAnnouncementPage";
import NewReaderPage from "./pages/newreaderpage/NewReaderPage";
import SiteSettingsPage from "./pages/site-settings/SiteSettingsPage";
import StaffBar from "./pages/makerspace_page/StaffBar";
import UsersPage from "./pages/lab_management/users/UsersPage";
import UserPage from "./pages/lab_management/users/UserPage";
import { CartListPage } from "./pages/lab_management/storefront/internal/CartListPage";
import TrainingModulesPage from "./pages/lab_management/training_modules/TrainingModulesPage";
import NewModulePage from "./pages/lab_management/edit_module/NewModulePage";
import EditActiveModulePage from "./pages/lab_management/edit_module/EditActiveModulePage";
import NewEquipmentPage from "./pages/makerspace_page/equipment_pages/NewEquipmentPage";
import { ToolItemPage } from "./pages/lab_management/inventory/ToolItemPage";
import AuditLogsPage from "./pages/lab_management/audit_logs/AuditLogsPage";
import OrganizationsPage from "./pages/lab_management/organizations/OrganizationsPage";
import ManageMakerspacePage from "./pages/makerspace_page/ManageMakerspacePage";
import CurrencyPage from "./pages/lab_management/currency/CurrencyPage";
import ManageRoomPage from "./pages/makerspace_page/MonitorRoomPage";
import { CartPage } from "./pages/lab_management/storefront/internal/CartPage";
import ManageEquipmentPage from "./pages/makerspace_page/equipment_pages/ManageEquipmentPage";
import ReservationRequestPage from "./pages/makerspace_page/reservation_pages/ReservationRequestPage";
import ManageReservationsPage from "./pages/makerspace_page/reservation_pages/ManageReservationsPage";
import MaintenancePage from "./pages/makerspace_page/maintenance_pages/MaintenancePage";
import { Box } from "@mui/material";
import InventoryPage from "./pages/makerspace_page/inventory_pages/InventoryPage";
import QuickEditInventoryPage from "./pages/makerspace_page/inventory_pages/QuickEditInventoryPage";
import DevicesPage from "./pages/makerspace_page/device_pages/DevicesPage";
import NewDevicePage from "./pages/makerspace_page/device_pages/NewDevicePage";
import AdminBar from "./pages/site-settings/AdminBar";
import ManageMakerspacesPage from "./pages/site-settings/ManageMakerspacesPage";

function AppRoot() {
  return (
    <CurrentUserProvider>
      <Outlet />
    </CurrentUserProvider>
  );
}

// Authed Routes
function AuthedRoute() {
  const user = useCurrentUser();
  if (user.visitor) {
    window.location.replace(import.meta.env.VITE_LOGIN_URL + "?redir=" + import.meta.env.VITE_ORIGIN + window.location.pathname);
    return <></>;
  } else {
    return <Outlet />;
  }
}

function TrainerRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isOnlyTrainer(user) || isStaffFor(user, Number(makerspaceID))) {
    return <Outlet />;
  } else {
    return <NoPrivilegePage />;
  }
}

function StaffRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isStaffFor(user, Number(makerspaceID))) {
    return <Outlet />;
  } else {
    return <NoPrivilegePage />;
  }
}

function ManagerRoute() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  if (isManagerFor(user, Number(makerspaceID))) {
    return <Outlet />;
  } else {
    return <NoPrivilegePage />;
  }
}

function AdminRoute() {
  const user = useCurrentUser();
  if (isAdmin(user)) {
    return <Outlet />;
  } else {
    return <NoPrivilegePage />;
  }
}

export const appRouter = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppRoot />,
      children: [
        { path: "/signup", element: <SignupPage /> },
        { path: "/admin/storefront/preview", element: <StorefrontPreviewPage /> },

        /* Routes for the static displays around the makerspaces */
        {
          path: "/display",
          children: [
            { path: "/display/announcements", element: <AnnouncementsDisplay /> },
            { path: "/display/hours/:makerspaceID", element: <HoursDisplay /> },
            { path: "/display/events", element: <EventsDisplay /> },
          ],
        },
        /* END STATIC DISPLAYS */

        {
          path: "/",
          element: <TopNav />,

          children: [
            { path: "/", element: <Dashboard /> },
            { path: "/makerspace/:makerspaceID", element: <MakerspacePage /> },
            { path: "/terms", element: <TermsPage /> },
            { path: "/help", element: <HelpPage /> },
            { path: "/storefront", element: <StorefrontPage /> },

            /* Routes that need to be protected by auth */
            {
              element: <AuthedRoute />,
              children: [
                { path: "/user/trainings", element: <UserTraingingsPage /> },
                { path: "/user/settings", element: <UserSettingsPage /> },

                { path: "/equipment/:equipmentID", element: <EquipmentRedirector /> },

                { path: "/makerspace/:makerspaceID/reserve/:equipmentID", element: <ReservationRequestPage /> },

                /* Routes for trainers + higher */
                {
                  element: <TrainerRoute />,
                  children: [
                    {
                      path: "/makerspace/:makerspaceID",
                      element: <Box padding={"0px 10px"}><StaffBar /></Box>,
                      children: [
                        { path: "/makerspace/:makerspaceID/people", element: <UsersPage /> },
                        { path: "/makerspace/:makerspaceID/people/:userID", element: <UserPage /> },
                        { path: "/makerspace/:makerspaceID/storefront/carts", element: <CartListPage /> },
                        { path: "/makerspace/:makerspaceID/storefront/carts/:cartID", element: <CartPage /> },

                        /* Routes for staff + higher */
                        {
                          element: <StaffRoute />,
                          children: [
                            { path: "/makerspace/:makerspaceID/trainings", element: <TrainingModulesPage /> },
                            { path: "/makerspace/:makerspaceID/training/new", element: <NewModulePage /> },
                            { path: "/makerspace/:makerspaceID/training/:id", element: <EditActiveModulePage /> },

                            { path: "/makerspace/:makerspaceID/equipment/new", element: <NewEquipmentPage /> },
                            { path: "/makerspace/:makerspaceID/equipment/:equipmentID", element: <ManageEquipmentPage /> },

                            { path: "/makerspace/:makerspaceID/inventory", element: <InventoryPage /> },
                            { path: "/makerspace/:makerspaceID/inventory/quick/item/:invID", element: <QuickEditInventoryPage fromTag={false} /> },
                            { path: "/makerspace/:makerspaceID/inventory/quick/tag/:invID", element: <QuickEditInventoryPage fromTag={true} /> },

                            { path: "/makerspace/:makerspaceID/tools", element: <ToolItemPage /> },
                            { path: "/makerspace/:makerspaceID/tools/type/:typeid", element: <ToolItemPage /> },
                            { path: "/makerspace/:makerspaceID/tools/type/", element: <ToolItemPage /> },
                            { path: "/makerspace/:makerspaceID/tools/instance/:instanceid", element: <ToolItemPage /> },
                            { path: "/makerspace/:makerspaceID/tools/instance/", element: <ToolItemPage /> },

                            { path: "/makerspace/:makerspaceID/history", element: <AuditLogsPage /> },
                            { path: "/makerspace/:makerspaceID/organizations", element: <OrganizationsPage /> },
                            { path: "/makerspace/:makerspaceID/maintenance", element: <MaintenancePage /> },
                            { path: "/makerspace/:makerspaceID/reservations", element: <ManageReservationsPage /> },

                            /* Routes for manager + higher */
                            {
                              element: <ManagerRoute />,
                              children: [
                                { path: "/makerspace/:makerspaceID/edit", element: <ManageMakerspacePage /> },
                                { path: "/makerspace/:makerspaceID/edit/room/:roomID", element: <ManageRoomPage /> },
                                { path: "/makerspace/:makerspaceID/currency", element: <CurrencyPage /> },

                                { path: "/makerspace/:makerspaceID/devices", element: <DevicesPage /> },
                                { path: "/makerspace/:makerspaceID/devices/new", element: <NewDevicePage /> },
                              ],
                            },
                            /* End manager routes */
                          ],
                        },
                      ],
                    },
                  ],
                },

                /* Routes for admins */
                {
                  element: <AdminRoute />,
                  children: [{
                    path: "/admin",
                    element: <AdminBar />,
                    children: [
                      { path: "/admin/announcements", element: <AnnouncementsPage /> },
                      { path: "/admin/announcements/:id", element: <EditAnnouncement /> },
                      { path: "/admin/announcements/new", element: <NewAnnouncementPage /> },

                      { path: "/admin/inventory", element: <AdminInventoryPage /> },
                      { path: "/admin/makerspaces", element: <ManageMakerspacesPage /> },

                      { path: "/admin/settings", element: <SiteSettingsPage /> },
                    ]
                  }],
                },

                { path: "/maker/training", element: <TrainingPage /> },
                { path: "/maker/training/:id", element: <QuizPage /> },
                { path: "/maker/training/:id/results/", element: <QuizResults /> },
                { path: "/maker/training/:id/results/:submissionID", element: <QuizResults /> },
              ],
            },
            /* END OF PROTECTED ROUTES */

            { path: "/storefront", element: <StorefrontPage /> },

            { path: "/logoutprompt", element: <LogoutPromptPage /> },

            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);
