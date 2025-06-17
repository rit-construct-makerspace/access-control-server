import { Outlet, Route, Routes, useParams } from "react-router-dom";
import StorefrontPreviewPage from "./pages/lab_management/storefront_preview/StorefrontPreviewPage";
import EditEquipmentPage from "./pages/lab_management/manage_equipment/EditEquipmentPage";
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
import ManageEquipmentPage from "./pages/lab_management/manage_equipment/ManageEquipmentPage";
import NotFoundPage from "./pages/NotFoundPage";
import EditActiveModulePage from "./pages/lab_management/edit_module/EditActiveModulePage";
import EditArchivedModulePage from "./pages/lab_management/edit_module/EditArchivedModulePage";
import LogoutPromptPage from "./pages/both/logout/LogoutPromptPage";
import EditNewModulePage from "./pages/lab_management/edit_module/EditNewModulePage";
import NewAnnouncementPage from "./pages/lab_management/announcements/NewAnnouncementPage";
import EditAnnouncement from "./pages/lab_management/announcements/EditAnnouncement";
import ReadersPage from "./pages/lab_management/readers/ReadersPage";
import StatisticsPage from "./pages/lab_management/statistics/StatisticsPage";
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
import { isAdmin, isManagerFor, isStaffFor } from "./common/PrivilegeUtils";
import NoPrivilegePage from "./pages/NoPrivilegePage";

// This is where we map the browser's URL to a
// React component with the help of React Router.

function AuthedRoute() {
  const user = useCurrentUser();
  if (user.visitor) {
    window.location.replace(process.env.REACT_APP_LOGIN_URL ?? "/")
    return <></>;
  } else {
    return <Outlet />
  }
};

function StaffRoute() {
  const { makerspaceID } = useParams<{makerspaceID: string}>();
  const user = useCurrentUser();
  if (isStaffFor(user, Number(makerspaceID))) {
    return <Outlet/>
  } else {
    return <NoPrivilegePage/>
  }
}

function ManagerRoute() {
  const { makerspaceID } = useParams<{makerspaceID: string}>();
  const user = useCurrentUser();
  if (isManagerFor(user, Number(makerspaceID))) {
    return <Outlet />
  } else {
    return <NoPrivilegePage/>
  }
}

function AdminRoute() {
  const user = useCurrentUser();
  if (isAdmin(user)) {
    return <Outlet/>
  } else {
    return <NoPrivilegePage/>
  }
}

export default function AppRoutes() {
  return (
    <div className="app">

    <Routes>

        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/storefront/preview" element={<StorefrontPreviewPage />} />

        <Route path={"/"} element={<TopNav />}>

          <Route path="/" element={<Dashboard />} />
          <Route path="/makerspace/:makerspaceID" element={<MakerspacePage />}/>
          <Route path="/terms" element={<TermsPage />} />

          {/* Routes that need to be protected by auth */}
          <Route element={<AuthedRoute />}> 
            <Route path="/user/trainings" element={<UserTraingingsPage />}/>
            <Route path="/user/settings" element={<UserSettingsPage />}/>

            {/* Routes for staff + higher */}
            <Route element={<StaffRoute/>}>
              <Route path="/makerspace/:makerspaceID" element={<StaffBar/>}>
                {/* Routes for manager + higher */}
                <Route element={<ManagerRoute/>}>
                  <Route path="/makerspace/:makerspaceID/edit" element={<ManageMakerspacePage />}/>
                  <Route path="/makerspace/:makerspaceID/edit/room/:roomID" element={<ManageRoomPage />}/>
                </Route>
                {/* End manager routes */}
                <Route path="/makerspace/:makerspaceID/tools" element={<ToolItemPage />}/>
                <Route path="/makerspace/:makerspaceID/people" element={<UsersPage />}/>
                <Route path="/makerspace/:makerspaceID/people/:userID" element={<UsersPage />}/>
                <Route path="/makerspace/:makerspaceID/history" element={<AuditLogsPage />}/>
                <Route path="/makerspace/:makerspaceID/readers" element={<ReadersPage/>}/>
              </Route>
            </Route>

            {/* Routes for admins */}
            <Route element={<AdminRoute/>}>
              <Route path="/admin/announcements" element={<AnnouncementsPage />} />
              <Route path="/admin/announcements/:id" element={<EditAnnouncement />} />
              <Route path="/admin/announcements/new" element={<NewAnnouncementPage />} />

              <Route path="/admin/newreader" element={<NewReaderPage />} />
            </Route>

            <Route path="/maker/training" element={<TrainingPage />} />
            <Route path="/maker/training/:id" element={<QuizPage />} />
            <Route path="/maker/training/:id/results" element={<QuizResults />} />

            <Route path="/maker/materials" element={<InventoryPreviewPage />} />
            <Route path="/admin/equipment" element={<ManageEquipmentPage />} />
            <Route path="/admin/equipment/:id" element={<EditEquipmentPage archived={false} />} />
            <Route path="/admin/equipment/archived/:id" element={<EditEquipmentPage archived={true} />} />
            <Route path="/admin/equipment/issues/:logid" element={<ManageEquipmentPage showLogs={true} />} />
            <Route path="/admin/equipment/logs/:logid" element={<ResolutionLogPage />} />

            <Route path="/admin/training" element={<TrainingModulesPage />} />
            <Route path="/admin/training/new" element={<EditNewModulePage />} />
            <Route path="/admin/training/:id" element={<EditActiveModulePage />} />
            <Route path="/admin/training/archived/:id" element={<EditArchivedModulePage />} />

            <Route path="/admin/inventory" element={<InventoryPage />} />
            <Route path="/admin/tools/type/:typeid" element={<ToolItemPage />} />
            <Route path="/admin/tools/type" element={<ToolItemPage />} />
            <Route path="/admin/tools/instance/:instanceid" element={<ToolItemPage />} />
            <Route path="/admin/tools/instance" element={<ToolItemPage />} />

            <Route path="/admin/storefront" element={<StorefrontPage />} />

            <Route path="/admin/statistics" element={<StatisticsPage />} />

            <Route path="/admin/terms" element={<EditTermsPage />} />
          </Route>
          {/* END OF PROTECTED ROUTES */}

          <Route path="/logoutprompt" element={<LogoutPromptPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
    </Routes>
    </div>
  );
}
