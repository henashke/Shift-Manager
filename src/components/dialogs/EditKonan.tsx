import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {Employee} from "../../stores/ShiftStore";

interface EditKonanProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    handleConfirm: (employee: Employee) => void;
    employee?: Employee;
}

const EditKonan: React.FC<EditKonanProps> = ({
                                                     open,
                                                     handleDialogClose,
                                                     handleConfirm,
                                                 employee
                                                 }) => (
    <CommonDialog open={open}
                  title={"עריכת כונן" + employee?.name}
                  content={<>עריכת כונן (מימוש בהמשך)</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default EditKonan;


