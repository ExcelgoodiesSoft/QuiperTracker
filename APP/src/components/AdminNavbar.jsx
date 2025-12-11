import React from "react";
import companyLogo from "../assets/quipersoft_top_logo1.svg";
import { getLoggedInUser, logout } from "../services/authService";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

const AdminNavbar = () => {
    const loggedInUser = getLoggedInUser();
    const handleLogout = () => {
        logout();
        window.location.href = "/";
    };

    const isAdmin = loggedInUser?.role?.toLowerCase() === "admin";

    return (
        <nav className="navbar navbar-expand-lg bg-white shadow-sm mb-2 w-100 border-bottom">
            <div className="container-fluid">
                {/* Company Logo */}
                <span className="navbar-brand">
                    <img
                        src={companyLogo}
                        alt="Company Logo"
                        style={{ width: "120px", height: "auto" }}
                    />
                </span>

                {isAdmin && (
                    <>
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        {/* Navbar Links */}
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav me-auto align-items-center" style={{ gap: "1rem" }}>
                                <li className="nav-item">
                                    <Dropdown>
                                        <Dropdown.Toggle
                                            variant="white"
                                            className="text-black fw-normal border-0"
                                            id="config-dropdown"
                                        >
                                            Config
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item as={Link} to="/admin/config/clients">
                                                Client Config
                                            </Dropdown.Item>
                                            <Dropdown.Item as={Link} to="/admin/config/projects">
                                                Project Config
                                            </Dropdown.Item>
                                            <Dropdown.Item as={Link} to="/admin/config/roles">
                                                Role Config
                                            </Dropdown.Item>
                                            <Dropdown.Item as={Link} to="/admin/config/users">
                                                User Config
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link text-black" to="/admin">Update Timesheet</Link>
                                </li>

                                <li className="nav-item">
                                    <Link className="nav-link text-black" to="/admin/view-timesheet">View Timesheet</Link>
                                </li>

                            </ul>
                        </div>
                    </>
                )}
                <div className="d-flex align-items-center">
                    <span className="me-3 text-black fw-semibold">
                        {loggedInUser ? loggedInUser.name : ""}
                    </span>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;