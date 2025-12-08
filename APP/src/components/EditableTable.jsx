import React, { useState, useEffect } from "react";
import { FaPencilAlt, FaTrashAlt, FaFileExcel, FaTimes } from "react-icons/fa";
import { OverlayTrigger, Tooltip, Modal, Button } from "react-bootstrap";
const EditableTable = ({
    columns = [],
    data = [],
    setData,
    dropdownOptions = {},
    canEdit = true,
    showAddButton = true,
    readOnlyFields = [],
    onDataChange,
    showDelete = true,
    defaultUsername,
    Isrole,
    addItem,
    updateItem,
    deleteItem,
    loadReports,
    sortColumn,
    sortDirection,
    setSortDirection,
    setSortColumn,
    onPageChange,
    pageSize,
    currentPage,
    totalCount,
    onExportExcel,
    showExportButton = true,
    showHeader = false
}) => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState("success");
    const [editIndex, setEditIndex] = useState(null);
    const [originalRow, setOriginalRow] = useState(null);
    const [addingNew, setAddingNew] = useState(false);
    const [newRow, setNewRow] = useState(
        Object.fromEntries(columns.map(
            (c) => [c.accessor, c.accessor === "username" ? defaultUsername || "" :
                c.accessor === "status" ? "Active" : ""])
        )
    );
    const [rowErrors, setRowErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        if (addingNew && "date" in newRow && !newRow.date) {
            setNewRow((prev) => ({
                ...prev,
                date: new Date().toISOString().split("T")[0],
            }));
        }
    }, [addingNew, newRow]);

    // Handle change for new or existing rows
    const handleChange = (e, index = null) => {
        const { name, value } = e.target;
        if (index === null) {
            setNewRow((prev) => ({ ...prev, [name]: value }));
        } else {
            const updateData = data.map((row, i) =>
                i === index ? { ...row, [name]: value } : row
            );
            setData(updateData);
        }
    };

    const triggerToast = (message, color = "success") => {
        setToastMessage(message);
        setShowToast(true);
        setToastColor(color);
        setTimeout(() => setShowToast(false), 2000);
    };

    //  Add new row
    const handleAddRow = async () => {

        const hasEmptyField = Object.entries(newRow).some(([key, value]) => {
            if (key === "id" || key === "sno") return false;
            return value === "" || value === null || value === undefined;
        });

        if (hasEmptyField) {
            const errors = {};
            Object.entries(newRow).forEach(([key, value]) => {
                if (key === "id" || key === "sno") return;
                if (!value) errors[key] = true;
            });
            triggerToast("Please fill all required fields before saving.", "danger");
            setRowErrors(errors);
            return;
        }

        const rowToAdd = { ...newRow };

        if ("date" in rowToAdd && !rowToAdd.date) {
            rowToAdd.date = new Date().toISOString().split("T")[0];
        }

        try {
            const response = await addItem(rowToAdd);
            if (response?.success && response.data) {
                const updateData = [...data, response.data];
                setRowErrors({});
                setData(updateData);
                triggerToast(response.message || "Report added successfully!", "success");
                if (onDataChange) onDataChange();
            } else {
                triggerToast(response.message || "Failed to add report.", "danger");
            }
        } catch (error) {
            console.error("Error adding report:", error);
            triggerToast("An error occurred while adding the report.", "danger");
        }
        setNewRow(Object.fromEntries(
            columns.map((c) => [
                c.accessor,
                c.accessor === "username"
                    ? defaultUsername || ""
                    : c.accessor === "status"
                        ? "Active"
                        : "",
            ])
        ));
        setAddingNew(false);
    };

    //  Edit row
    const handleEdit = (index) => {
        setOriginalRow({ ...data[index] });
        setEditIndex(index);
    };
    //Cancel
    const handleCancel = () => {
        setRowErrors({});
        if (addingNew) {
            //cancel adding
            setAddingNew(false);
            setNewRow(Object.fromEntries(
                columns.map((c) => [
                    c.accessor,
                    c.accessor === "username" ?
                        defaultUsername || ""
                        : c.accessor === "status" ? "Active"
                            : "",
                ])
            ));
        }

        if (editIndex !== null) {
            const updatedData = [...data];
            updatedData[editIndex] = originalRow;
            setData(updatedData);
            setEditIndex(null);
            setOriginalRow(null);
        }
    }

    //  Update edited row
    const handleUpdate = async () => {
        if (editIndex === null) return;
        const updateData = [...data];
        const row = updateData[editIndex];

        const hasEmptyField = Object.entries(row).some(([key, value]) => {
            if (key === "id" || key === "sno") return false;
            return value === "" || value === null || value === undefined;
        });

        if (hasEmptyField) {
            // alert("Please fill all fields before updating.");
            const errors = {};
            Object.entries(newRow).forEach(([key, value]) => {
                if (key === "id" || key === "sno") return;
                if (!value) errors[key] = true;
            });
            setRowErrors(errors);
            triggerToast("Please fill all required fields before Updating.", "danger");
            return;
        }

        if (!row.id) {
            triggerToast("Missing report ID", "danger");
            return;
        }

        try {
            const response = await updateItem(row.id, row);
            if (response?.success) {
                updateData[editIndex] = response.data || row;
                setData(updateData);
                setEditIndex(null);
                setRowErrors({});
                if (onDataChange)
                    onDataChange();
                triggerToast(response.message || "Report updated successfully!", "success");
            } else {
                triggerToast(response.message || "Failed to update report.", "danger");
            }
        } catch (error) {
            console.error("Error updating:", error);
            triggerToast("Error updating report.", "danger");
        }
    };

    //  Delete row
    const handleDelete = async (index) => {
        const row = data[index];
        if (!row.id) {
            triggerToast("Missing report ID", "danger");
            return;
        }
        try {
            const response = await deleteItem(row.id);
            if (response?.success) {
                const updateData = data.filter((_, i) => i !== index);
                setData(updateData);
                if (onDataChange)
                    onDataChange();
                triggerToast(response.message || "Report deleted successfully!", "success")
            } else {
                triggerToast(response.message || "Failed to delete report.", "danger");
            }

        } catch (error) {
            console.error("Error deleting:", error);
            triggerToast("Error deleting report.", "danger");
        }
    };

    const openDeleteModal = (index) => {
        setDeleteIndex(index);
        setShowModal(true);
    };

    const confirmDelete = () => {
        handleDelete(deleteIndex);
        setShowModal(false);
    };

    const handleExportClick = async () => {
        const result = await onExportExcel();

        if (!result) return;

        if (result.success) {
            triggerToast(result.message, "success");
        } else {
            triggerToast(result.message, "danger");
        }
    };

    const renderInput = (col, value, onChange) => {
        const opts = dropdownOptions[col.accessor];
        if (opts) {
            return (
                <>
                    {/* {rowErrors[col.accessor] && !value && <sup className="text-danger">{rowErrors[col.accessor]}</sup>} */}
                    <select
                        name={col.accessor}
                        value={value || ""}
                        onChange={onChange}
                        className={`form-select ${rowErrors[col.accessor] && !value ? "border-danger border-2" : ""}`}
                    >
                        <option value="">Select</option>
                        {opts.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </>
            );
        }

        const inputType = col.accessor === "date" ? "date" : "text";

        return (
            <>
                {/* {rowErrors[col.accessor] && !value && <sup className="text-danger">{rowErrors[col.accessor]}</sup>} */}
                <input
                    type={inputType}
                    name={col.accessor}
                    value={value}
                    onChange={onChange}
                    className={`form-control ${rowErrors[col.accessor] && !value ? "border-danger border-2" : ""}`}
                    readOnly={readOnlyFields.includes(col.accessor)}
                />
            </>
        );
    };

    // Find the index of "status" column
    const statusIndex = columns.findIndex(c => c.accessor === "status");

    return (
        <>
            <div style={{
                position: "fixed",
                top: "70px",
                right: "20px",
                zIndex: 2000,
            }}>
                {showToast && (
                    <div className={`toast show bg-${toastColor} text-white px-3 py-2 rounded shadow`}>
                        {toastMessage}
                    </div>
                )}
            </div>

            <div
                className="d-flex align-items-center 
                justify-content-between mb-2 px-5 w-100"
            >

                <div className="flex-grow-1 text-center">
                    {showHeader && (
                        <h4 className="mb-0">{
                            defaultUsername && Isrole ? `Update Timesheet` : "View TimeSheet"
                        }</h4>
                    )}
                </div>
                <div className="d-flex gap-2 mt-1">
                    {showExportButton && onExportExcel && (
                        <OverlayTrigger
                            placement="auto"
                            overlay={<Tooltip>Download reports as Excel</Tooltip>}
                        >
                            <button className="btn btn-success btn-md px-3 ms-0"
                                onClick={handleExportClick}
                            >
                                <FaFileExcel size={16} />
                            </button>
                        </OverlayTrigger>
                    )}
                </div>

                <div>
                    {showAddButton && canEdit && (
                        <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Add Entries</Tooltip>}
                        >
                            <button
                                className="btn btn-primary ms-3 px-5 mt-1 add"
                                onClick={() => {
                                    setAddingNew(true);
                                    setRowErrors({});
                                }}
                                disabled={addingNew}
                            >
                                Add
                            </button>
                        </OverlayTrigger>
                    )}
                </div>

            </div>

            <div className="px-5 theight">
                <table className="table table-bordered">
                    <thead className="custom-thead align-middle">
                        <tr>
                            {columns.map((col, idx) => {
                                const handleSort = () => {
                                    if (!col.sortable) return; // only sortable columns
                                    if (sortColumn === col.accessor) {
                                        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                                    } else {
                                        setSortColumn(col.accessor);
                                        setSortDirection("asc");
                                    }
                                    onPageChange(1); // reset page
                                    loadReports();
                                };
                                // Insert Action before Status
                                if (idx === statusIndex && canEdit) return [
                                    <th key="action" style={{ width: "120px" }}>Action</th>,
                                    <th
                                        key={col.accessor}
                                        onClick={handleSort}
                                        style={{
                                            cursor: col.sortable ? "pointer" : "default",
                                            width: col.width || "auto"
                                        }}

                                    >
                                        {col.header}
                                    </th>
                                ];
                                return <th
                                    key={col.accessor}
                                    onClick={handleSort}
                                    style={{
                                        cursor: col.sortable ? "pointer" : "default",
                                        width: col.width || "auto"
                                    }}
                                >
                                    {col.header}
                                </th>;
                            })}
                            {/* If no status column, append Action at end */}
                            {statusIndex === -1 && canEdit && <th style={{ width: "120px" }}>Action</th>}
                        </tr>
                    </thead>

                    <tbody className="text-center">
                        {data.length === 0 && !addingNew && (
                            <tr>
                                <td
                                    colSpan={columns.length + (canEdit ? 1 : 0)}
                                    className="text-center text-muted py-4"
                                >
                                    No records found
                                </td>
                            </tr>
                        )}
                        {addingNew && (
                            // status column if present
                            <tr>
                                {columns.map((col, idx) => {
                                    if (col.accessor === "sno") return <td key={col.accessor} style={{ textAlign: "center" }}>{(totalCount) + 1}</td>;

                                    // Action before Status in new row
                                    if (idx === statusIndex && canEdit) return [
                                        <td key="action-new">
                                            <button className="btn btn-dark text-white btn-sm me-2" onClick={handleAddRow}>
                                                Update
                                            </button>
                                            <button className="btn btn-danger text-white btn-sm" onClick={handleCancel}>
                                                <FaTimes size={16} />
                                            </button>
                                        </td>,
                                        <td key={col.accessor}>
                                            <div className="form-check form-switch d-flex justify-content-center">
                                                {newRow.status || "Inactive"}
                                                <input
                                                    className="form-check-input ms-2"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={newRow.status === "Active"}
                                                    onChange={() =>
                                                        setNewRow((prev) => ({
                                                            ...prev,
                                                            status: prev.status === "Active" ? "Inactive" : "Active"
                                                        }))
                                                    }
                                                    style={{ width: "40px", height: "20px" }}
                                                />
                                            </div>
                                        </td>
                                    ];

                                    return <td key={col.accessor}>{renderInput(col, newRow[col.accessor], handleChange)}</td>;
                                })}
                                {statusIndex === -1 && canEdit && (
                                    <td style={{ textAlign: "center" }}>
                                        <button className="btn btn-dark text-white btn-sm me-2" onClick={handleAddRow}>Update</button>
                                        <button className="btn btn-danger text-white btn-sm" onClick={handleCancel}>
                                            <FaTimes size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )}

                        {data.map((row, index) => (
                            <tr key={row.id || index}>
                                {columns.map((col, idx) => {
                                    const sno = ((currentPage || 1) - 1) * pageSize + index + 1;
                                    if (col.accessor === "sno") return <td key={col.accessor} style={{ textAlign: "center" }}>{sno}</td>;

                                    // Action before Status in existing rows
                                    if (idx === statusIndex && canEdit) {
                                        return [
                                            <td key={"action-" + index} className="py-2 text-center">
                                                {editIndex === index ? (
                                                    <>
                                                        <button className="btn btn-dark text-white btn-sm me-2" onClick={handleUpdate}>Update</button>
                                                        <button className="btn btn-danger text-white btn-sm" onClick={handleCancel}>
                                                            <FaTimes size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn btn-link text-dark me-2 p-0"
                                                            onClick={() => handleEdit(index)}
                                                        ><FaPencilAlt /></button>
                                                        {showDelete && (
                                                            <button
                                                                className="btn btn-link text-dark p-0"
                                                                onClick={() => openDeleteModal(index)}
                                                            ><FaTrashAlt /></button>
                                                        )}
                                                    </>
                                                )}
                                            </td>,
                                            <td key={col.accessor} >
                                                <div className="form-check form-switch d-flex justify-content-center">
                                                    {row.status}
                                                    <input
                                                        className="form-check-input ms-2"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={row.status === "Active"}
                                                        onChange={() => {
                                                            const updated = data.map((r, i) =>
                                                                i === index ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r
                                                            );
                                                            setData(updated);
                                                        }}
                                                        style={{ width: "40px", height: "20px" }}
                                                    />
                                                </div>
                                            </td>
                                        ]
                                    };

                                    const displayValue =
                                        col.accessor === "date" && !(editIndex === index && canEdit)
                                            ? formatDate(row[col.accessor])
                                            : row[col.accessor];

                                    return <td key={col.accessor}
                                        className={
                                            col.accessor === "date" ? "date-row" :
                                                (col.accessor === "manHours" || col.accessor === "manMinutes") ? "time-cell" : ""
                                        }
                                    >
                                        {editIndex === index && canEdit
                                            ? renderInput(col, row[col.accessor], (e) => handleChange(e, index))
                                            : displayValue}
                                    </td>;
                                })}
                                {/* here it works */}
                                {statusIndex === -1 && canEdit && (
                                    <td className="py-2 text-center">
                                        {(() => {
                                            const today = new Date().toISOString().split("T")[0];
                                            const rowDate = row.date; // your table already uses "date"

                                            if (rowDate !== today) {
                                                return <span></span>;
                                            }
                                        })()}

                                        {row.date === new Date().toISOString().split("T")[0] && (
                                            editIndex === index ? (
                                                <>
                                                    <button className="btn btn-dark text-white btn-sm me-2" onClick={handleUpdate}>Update</button>
                                                    <button className="btn btn-danger text-white btn-sm" onClick={handleCancel}>
                                                        <FaTimes size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-link text-dark me-3 p-0"
                                                        onClick={() => handleEdit(index)}
                                                    ><FaPencilAlt /></button>
                                                    {showDelete && (
                                                        <button
                                                            className="btn btn-link text-danger p-0"
                                                            onClick={() => openDeleteModal(index)}
                                                        ><FaTrashAlt /></button>
                                                    )}
                                                </>
                                            ))}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Delete Confirmation Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Report</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete this report?
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </>
    );
};

export default EditableTable;