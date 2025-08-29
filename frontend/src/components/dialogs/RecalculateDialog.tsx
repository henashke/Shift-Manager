import React from 'react';
import CommonDialog, {CommonDialogProps} from "./CommonDialog";

interface DeleteUserProps extends Omit<CommonDialogProps, 'title' | 'content'> {
}

const RecalculateDialog: React.FC<DeleteUserProps> = ({
                                                          open,
                                                          handleDialogClose,
                                                          handleConfirm,
                                                      }) => (
    <CommonDialog open={open}
                  title={"חישוב ניקוד מחדש"}
                  content={<>האם אתה בטוח שברצונך לחשב את הניקוד מחדש?</>}
                  handleConfirm={handleConfirm}
                  handleDialogClose={handleDialogClose}
                  warningDialog/>
);

export default RecalculateDialog;
