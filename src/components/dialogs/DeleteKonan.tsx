import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";
import {Konan} from "../../stores/ShiftStore";

interface DeleteKonanProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    selectedKonan?: Konan;
    handleConfirm: (konanToDeleteId: string) => void;
}

const DeleteKonan: React.FC<DeleteKonanProps> = ({
                                                     open,
                                                     handleDialogClose,
                                                     handleConfirm,
                                                     selectedKonan
                                                 }) => (
    <CommonDialog open={open}
                  title={"מחיקת " + (selectedKonan ? selectedKonan.name : '')}
                  content={<>האם אתה בטוח שברצונך למחוק את {selectedKonan?.name}?</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}/>
);

export default DeleteKonan;
