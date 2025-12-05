import React, { useEffect, useState } from "react";
// import AdminTable from "../components/AdminTable";
import AddTimesheet from "../components/AddTimesheet"
import AdminNavbar from "../components/AdminNavbar";
// import { reports } from "../data/report";
import { getLoggedInUser } from "../services/authService";
import { fetchClients, fetchProjects, fetchReports, fetchUsers } from "../services/apiService";
import { Outlet, useLocation } from "react-router-dom";
import ExcelJS from "exceljs";
import fs from "file-saver";
// import FilterBar from "../components/FilterBar";
const AdminPage = () => {
    const location = useLocation();
    const loggedInUser = getLoggedInUser();
    const [reportData, setReportData] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const isDefault = location.pathname === "/admin";
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedClient, setSelectedClient] = useState("");
    const [sortColumn, setSortColumn] = useState("Date");
    const [sortDirection, setSortDirection] = useState("asc");
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const loadReports = async () => {
        try {
            const apiSortColumn = capitalizeFirstLetter(sortColumn);
            const res = await fetchReports(
                page,
                10,
                startDate,
                endDate,
                selectedUser,
                selectedClient,
                apiSortColumn,
                sortDirection
            );
            const filtered =
                loggedInUser?.role === "admin"
                    ? res.data
                    : "No data";
            setReportData(filtered);
            setTotalPages(res.totalPages || 1);
        } catch (err) {
            console.error("Error loading reports:", err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${day}-${month}-${year}`;
    };

    const handleExportAllReports = async () => {
        try {
            let allData = [];
            let currentPage = 1;
            const pageSize = 10;
            let totalPages = 1;

            do {
                const res = await fetchReports(
                    currentPage,
                    pageSize,
                    startDate,
                    endDate,
                    selectedUser,
                    selectedClient,
                    capitalizeFirstLetter(sortColumn),
                    sortDirection
                );

                if (!res?.success) break;

                allData = allData.concat(res.data || []);
                totalPages = res.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);

            if (!allData.length) {
                return {
                    success: false,
                    message: "No reports to export"
                };
            }

            // Create workbook and sheet
            const workbook = new ExcelJS.Workbook();
            const sheetName =
                location.pathname.includes("view-timesheet")
                    ? "AdminTimesheet"
                    : `${loggedInUser.name || "User"}Timesheet`;
            const worksheet = workbook.addWorksheet(sheetName);

            // Map data for export
            const exportRows = allData.map((r, i) => ({
                "S.No": i + 1,
                Date: formatDate(r.date),
                Username: r.username ?? "",
                Client: r.client ?? "",
                Project: r.project ?? "",
                Task: r.task ?? "",
                "Ticket No.": r.ticket ?? "",
                Call: r.call ?? "",
                "Man Hours": r.manHours !== undefined ? parseInt(r.manHours) : 0,
                "Man Minutes": r.manMinutes !== undefined ? parseInt(r.manMinutes) : 0
            }));

            // Add header row
            const headers = Object.keys(exportRows[0]);
            const headerRow = worksheet.addRow(headers);

            // Style headers
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCCCCC" } // light gray background
                };
                cell.border = {
                    top: { style: "medium" },
                    left: { style: "medium" },
                    bottom: { style: "medium" },
                    right: { style: "medium" }
                };
            });

            // Add data rows
            exportRows.forEach((row) => {
                const dataRow = worksheet.addRow(Object.values(row));
                dataRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" }
                    };
                });
            });

            // Auto width for columns
            worksheet.columns.forEach((column, i) => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const value = cell.value ? cell.value.toString() : "";
                    if (value.length > maxLength) maxLength = value.length;
                });
                column.width = maxLength + 5;
            });

            // Write to file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/octet-stream" });
            fs.saveAs(blob, `${sheetName}.xlsx`);

            const exportText = "All reports exported successfully!";
            return {
                success: true,
                message: exportText
            };

        } catch (err) {
            console.error("Error exporting all reports:", err);
            alert("Failed to export reports. Check console for details.");
        }
    };

    const loadDropdownData = async () => {
        try {
            const [clientRes, projectRes, userRes] = await Promise.all([
                fetchClients(),
                fetchProjects(),
                fetchUsers(),
            ]);

            setClients(clientRes.data || []);
            setProjects(projectRes.data || []);
            setUsers(userRes.data || []);
        } catch (err) {
            console.error("Error loading dropdown data:", err);
        }
    };


    useEffect(() => {
        loadReports();
        loadDropdownData();
        // eslint-disable-next-line
    }, [startDate, endDate, sortDirection, sortColumn, selectedClient, selectedUser, page]);

    const dropdownOptions = {
        username: users.filter((u) => u.status?.toLowerCase() !== "inactive").map((u) => u.name),
        client: clients.filter((c) => c.status?.toLowerCase() !== "inactive").map((c) => c.name),
        project: projects.filter((p) => p.status?.toLowerCase() !== "inactive").map((p) => p.project1),
        call: ["Yes", "No"],
        manHours: ["0", "1", "2"],
        manMinutes: ["0", "15", "30", "45"],
    };

    return (
        <>
            <div className="container-fluid page p-0">
                <AdminNavbar />
                {isDefault ? (
                    
                    <AddTimesheet />

                ) : (
                    <Outlet
                        context={{
                            data: reportData,
                            setData: setReportData,
                            page,
                            totalPages,
                            onPageChange: setPage,
                            loadReports,
                            dropdownOptions,
                            startDate,
                            setStartDate,
                            setEndDate,
                            endDate,
                            selectedClient,
                            selectedUser,
                            setSelectedClient,
                            setSelectedUser,
                            sortColumn,
                            sortDirection,
                            setSortDirection,
                            setSortColumn,
                            loggedInUser,
                            onExportExcel: handleExportAllReports,
                        }}
                    />
                )}
            </div >

        </>
    );
};

export default AdminPage;