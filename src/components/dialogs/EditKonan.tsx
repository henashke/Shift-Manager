import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {Konan} from "../../stores/ShiftStore";

interface EditKonanProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    handleConfirm: (konan: Konan) => void;
    konan?: Konan;
}

const EditKonan: React.FC<EditKonanProps> = ({
                                                     open,
                                                     handleDialogClose,
                                                     handleConfirm,
                                                     konan
                                                 }) => (
    <CommonDialog open={open}
                  title={"עריכת כונן" + konan?.name}
                  content={<>עריכת כונן (מימוש בהמשך)</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default EditKonan;
