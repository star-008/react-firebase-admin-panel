import ManagementDashboard from "./views/pages/admin/ManagementDashboard.jsx";
import Customers from "./views/pages/admin/Customers.jsx";
import Packages from "./views/pages/admin/Packages.jsx";
import PackageAdd from "./views/pages/admin/PackageAdd.jsx";
import PackageEdit from "./views/pages/admin/PackageEdit.jsx";
import Configurations from "./views/pages/admin/Configurations.jsx";
import Gallery from "./views/pages/admin/Gallery.jsx";
import Welcome from "./views/pages/admin/Welcome.jsx";
import Dashboard from "./views/pages/admin/Dashboard.jsx";
import Locations from "./views/pages/admin/Locations.jsx";
import Services from "./views/pages/admin/Services.jsx";
import Counters from "./views/pages/admin/Counters.jsx";
import CounterDisplays from "./views/pages/admin/CounterDisplays.jsx";
import MainDisplay from "./views/pages/admin/MainDisplay.jsx";
import Dispensors from "./views/pages/admin/Dispensors.jsx";
import Users from "./views/pages/admin/Users.jsx";
import UserAdd from "./views/pages/admin/UserAdd.jsx";
import UserEdit from "./views/pages/admin/UserEdit.jsx";
import Downloads from "./views/pages/admin/Downloads.jsx";
import Statistics from "./views/pages/admin/Statistics.jsx";
import AccountSettings from "./views/pages/admin/AccountSettings.jsx"
import Billing from "./views/pages/admin/Billing.jsx";

const routes = [
    {
        path: "/management_dashboard",
        name: "ManagementDashboard",
        icon: "nc-icon nc-palette",
        component: ManagementDashboard,
        layout: "/admin",
        site_hide: true,
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/customers",
        name: "Customers",
        icon: "nc-icon nc-badge",
        component: Customers,
        layout: "/admin",
        site_hide: true,
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/packages",
        name: "Packages",
        icon: "nc-icon nc-pin-3",
        component: Packages,
        layout: "/admin",
        site_hide: true,
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/package/add",
        name: "packageAdd",
        component: PackageAdd,
        layout: "/admin",
        hidden: true
    },
    {
        path: "/package/edit/:id",
        name: "packageEdit",
        component: PackageEdit,
        layout: "/admin",
        hidden: true
    },
    {
        path: "/configurations",
        name: "Configurations",
        icon: "nc-icon nc-settings",
        component: Configurations,
        layout: "/admin",
        site_hide: true,
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/gallery",
        name: "Gallery",
        icon: "nc-icon nc-album-2",
        component: Gallery,
        layout: "/admin",
        site_hide: true,
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/welcome",
        name: "Welcome",
        icon: "nc-icon nc-satisfied",
        component: Welcome,
        layout: "/admin",
    },
    {
        path: "/dashboard",
        name: "Dashboard",
        icon: "nc-icon nc-palette",
        component: Dashboard,
        layout: "/admin",
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/locations",
        name: "Locations",
        icon: "nc-icon nc-pin-3",
        component: Locations,
        layout: "/admin",
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/services",
        name: "Services",
        icon: "nc-icon nc-settings-gear-65",
        component: Services,
        layout: "/admin",
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/counters",
        name: "Counters",
        icon: "nc-icon nc-bank",
        component: Counters,
        layout: "/admin",
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/counter_displays",
        name: "Counter Displays",
        icon: "nc-icon nc-box-2",
        component: CounterDisplays,
        layout: "/admin",
        counter_hide: true,
        main_hide: true,
        dispenser_hide: true
    },
    {
        path: "/main_display",
        name: "Main Display",
        icon: "nc-icon nc-calendar-60",
        component: MainDisplay,
        layout: "/admin",
        counter_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/dispensors",
        name: "Dispensors",
        icon: "nc-icon nc-laptop",
        component: Dispensors,
        layout: "/admin",
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true
    },
    {
        path: "/users",
        name: "Users",
        icon: "nc-icon nc-single-02",
        component: Users,
        layout: "/admin",
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/user/edit/:id",
        name: "userEdit",
        component: UserEdit,
        layout: "/admin",
        hidden: true
    },
    {
        path: "/user/add",
        name: "userAdd",
        component: UserAdd,
        layout: "/admin",
        hidden: true
    },
    {
        path: "/downloads",
        name: "Downloads",
        icon: "nc-icon nc-cloud-download-93",
        component: Downloads,
        layout: "/admin"
    },
    {
        path: "/statistics",
        name: "Statistics",
        icon: "nc-icon nc-chart-bar-32",
        component: Statistics,
        layout: "/admin",
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/account_settings",
        name: "Account Settings",
        icon: "nc-icon nc-circle-10",
        component: AccountSettings,
        layout: "/admin"
    },
    {
        path: "/billing",
        name: "Billing",
        icon: "nc-icon nc-money-coins",
        component: Billing,
        layout: "/admin",
        local_hide: true,
        counter_hide: true,
        main_hide: true,
        counter_display_hide: true,
        dispenser_hide: true
    },
    {
        path: "/logout",
        name: "Logout",
        component: null
    },
];

export default routes;
