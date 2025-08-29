import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

interface DeleteUserProps extends Omit<CommonDialogProps, 'title' | 'content' | 'handleConfirm'> {
    handleConfirm: (userToDeleteId: string) => void;
}

const ResetWeeklyShiftsDialog: React.FC<DeleteUserProps> = ({
                                                                open,
                                                                handleDialogClose,
                                                                handleConfirm,
                                                            }) => (
    <CommonDialog open={open}
                  title={"אישור איפוס"}
                  content={<>האם אתה בטוח שברצונך לאפס את כל המשמרות של השבוע הנוכחי?</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  warningDialog/>
);

export default ResetWeeklyShiftsDialog;
