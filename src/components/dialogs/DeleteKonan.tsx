import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {Employee} from "../../stores/ShiftStore";

interface DeleteKonanProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    selectedEmployee?: Employee;
    handleConfirm: (konanToDeleteId: string) => void;
}

const DeleteKonan: React.FC<DeleteKonanProps> = ({
                                                     open,
                                                     handleDialogClose,
                                                     handleConfirm,
                                                     selectedEmployee
                                                 }) => (
    <CommonDialog open={open}
                  title={"מחיקת " + (selectedEmployee ? selectedEmployee.name : '')}
                  content={<>האם אתה בטוח שברצונך למחוק את {selectedEmployee?.name}?</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default DeleteKonan;


