import { Outlet, useParams } from "react-router-dom";
import { CurrentUserProvider, useCurrentUser } from "./common/CurrentUserProvider";
import { isAdmin, isManagerFor, isOnlyTrainer, isStaffFor } from "./common/PrivilegeUtils";
import NoPrivilegePage from "./pages/NoPrivilegePage";
import NotFoundPage from "./pages/NotFoundPage";
import { Dashboard } from "./pages/both/homepage/Dashboard";
import LogoutPromptPage from "./pages/both/logout/LogoutPromptPage";
import TermsPage from "./pages/both/policy/TermsPage";
import UserSettingsPage from "./pages/both/user_page/user_settings/UserSettingsPage";
import UserTraingingsPage from "./pages/both/user_page/user_trainings/UserTrainingsPage";
import HelpPage from "./pages/maker/signup/HelpPage";
import SignupPage from "./pages/maker/signup/SignupPage";
import MakerspacePage from "./pages/makerspace_page/MakerspacePage";
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
import StaffBar from "./pages/makerspace_page/StaffBar";
import UsersPage from "./pages/lab_management/users/UsersPage";
import UserPage from "./pages/lab_management/users/UserPage";
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
import ManageMakerspacesAdminPage from "./pages/site-settings/ManageMakerspacesPage";
import LinkManagementAdminPage from "./pages/site-settings/LinkManagementAdminPage";
import AdminHistoryPage from "./pages/site-settings/AdminHistoryPage";
import ThemeManagementPage from "./pages/site-settings/ThemeManagementPage";
import NewThemePage from "./pages/site-settings/NewThemePage";
import ManageThemePage from "./pages/site-settings/ManageThemePage";

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

export const routes = [
  {
    path: "/",
    element: <AppRoot />,
    children: [
      { path: "/signup", element: <SignupPage /> },

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

          /* Routes that need to be protected by auth */
          {
            element: <AuthedRoute />,
            children: [
              { path: "/user/trainings", element: <UserTraingingsPage /> },
              { path: "/user/settings", element: <UserSettingsPage /> },

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

                    { path: "/admin/themes", element: <ThemeManagementPage /> },
                    { path: "/admin/themes/new", element: <NewThemePage /> },
                    { path: "/admin/themes/:themeKey", element: <ManageThemePage /> },

                    { path: "/admin/inventory", element: <AdminInventoryPage /> },
                    { path: "/admin/makerspaces", element: <ManageMakerspacesAdminPage /> },
                    { path: "/admin/links", element: <LinkManagementAdminPage /> },
                    { path: "/admin/history", element: <AdminHistoryPage /> },
                  ]
                }],
              },

              { path: "/maker/training/:id", element: <QuizPage /> },
              { path: "/maker/training/:id/results/", element: <QuizResults /> },
              { path: "/maker/training/:id/results/:submissionID", element: <QuizResults /> },
            ],
          },
          /* END OF PROTECTED ROUTES */

          { path: "/logoutprompt", element: <LogoutPromptPage /> },

          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
