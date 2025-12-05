import React from 'react';
import EditableTable from "./EditableTable"
import { updateReport, deleteReport, addReport } from "../services/apiService";
import FilterBar from "../components/FilterBar";
import { useOutletContext } from 'react-router-dom';
import PaginationControls from './PaginationControls';

const AdminTable = (
) => {

    const {
        data,
        setData,
        page,
        totalPages,
        onPageChange,
        loadReports,
        dropdownOptions,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        setSelectedUser,
        setSelectedClient,
        selectedUser,
        selectedClient,
        sortColumn,
        sortDirection,
        setSortDirection,
        setSortColumn,
        onExportExcel
    } = useOutletContext();

    const columns = [
        { header: "Date", accessor: "date", sortable: true, width: "140px" },
        { header: "Username", accessor: "username", width: "140px" },
        { header: "Client", accessor: "client", width: "120px" },
        { header: "Project / Application", accessor: "project", width: "166px" },
        { header: "Task", accessor: "task" },
        { header: "Ticket No.", accessor: "ticket", width: "110px" },
        { header: "Call", accessor: "call", width: "110px" },
        { header: "Man Hours", accessor: "manHours", width: "110px" },
        { header: "Man Minutes", accessor: "manMinutes", width: "110px" },
    ];

    return (
        <>
            <FilterBar
                users={dropdownOptions.username}
                clients={dropdownOptions.client}
                startDate={startDate}
                endDate={endDate}
                selectedUser={selectedUser}
                selectedClient={selectedClient}

                onChange={({ startDate: s, endDate: e }) => {
                    setStartDate(s);
                    setEndDate(e);
                    onPageChange(1);
                    loadReports(s, e);
                }}

                onUserChange={(user) => {
                    setSelectedUser(user);
                    loadReports(user);
                    onPageChange(1);
                }}

                onClientChange={(client) => {
                    setSelectedClient(client);
                    onPageChange(1);
                }}

                onReset={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setStartDate(today);
                    setEndDate(today);
                    setSelectedUser("");
                    setSelectedClient("");
                    setSortDirection("asc");
                    onPageChange(1);
                }}
            />
            <div className="container-fluid px-4 table-wrapper">
                
                <EditableTable
                    columns={columns}
                    data={data}
                    setData={setData}
                    dropdownOptions={dropdownOptions}
                    canEdit={false}
                    showAddButton={false}
                    onDataChange={() => loadReports()}
                    addItem={addReport}
                    updateItem={updateReport}
                    deleteItem={deleteReport}
                    setSortColumn={setSortColumn}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                    loadReports={loadReports}
                    onPageChange={onPageChange}
                    onExportExcel={onExportExcel}
                    showExportButton={true}
                    showHeader={true}
                />
                <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
                
            </div>
        </>
    );

};

export default AdminTable;