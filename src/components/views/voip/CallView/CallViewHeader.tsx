import { CallType } from 'matrix-js-sdk/src/webrtc/call';
import React from 'react';
import { _t } from '../../../../languageHandler';
import RoomAvatar from '../../avatars/RoomAvatar';
import AccessibleButton from '../../elements/AccessibleButton';
import { Room } from 'matrix-js-sdk/src/models/room';
import dis from '../../../../dispatcher/dispatcher';

const callTypeTranslationByType: Record<CallType, () => string> = {
  [CallType.Video]: () => _t("Video Call"),
  [CallType.Voice]: () => _t("Audio Call"),
  // TODO: Add translation for jitsi call
  [CallType.Jitsi]: () => _t("Video Call"),
};

interface CallViewHeaderProps {
  pipMode: boolean;
  callType: CallType;
  // Not needed for Jitsi calls
  callRoom?: Room;
  // Not needed for Jitsi calls
  secondCallRoom?: Room;
  onPipMouseDown: (event: React.MouseEvent<Element, MouseEvent>) => void
}

const onRoomAvatarClick = (roomId: string) => {
    dis.dispatch({
    action: 'view_room',
    room_id: roomId,
    });
};

const onFullscreenClick = () => {
    dis.dispatch({
    action: 'video_fullscreen',
    fullscreen: true,
    });
};

const onExpandClick = (roomId: string) => {
    dis.dispatch({
    action: 'view_room',
    room_id: roomId,
    });
};

type CallControlsProps = Pick<CallViewHeaderProps, 'pipMode' | 'callType' | 'callRoom'>;
function CallControls({ pipMode = false, callType, callRoom }: CallControlsProps) {
    return <div className="mx_CallView_header_controls">
        {(pipMode &&
      (callType === CallType.Video || callType === CallType.Jitsi)) &&
      <div className="mx_CallView_header_button mx_CallView_header_button_fullscreen"
          onClick={onFullscreenClick} title={_t("Fill Screen")}
      />}
        {pipMode && <div className="mx_CallView_header_button mx_CallView_header_button_expand"
            onClick={() => onExpandClick(callRoom.roomId)} title={_t("Return to call")}
        />}
    </div>;
}

function SecondaryCallInfo({ secondCallRoom }: Pick<CallViewHeaderProps, 'secondCallRoom'>) {
    return <span className="mx_CallView_header_secondaryCallInfo">
        <AccessibleButton element='span' onClick={() => onRoomAvatarClick(secondCallRoom.roomId)}>
            <RoomAvatar room={secondCallRoom} height={16} width={16} />
            <span className="mx_CallView_secondaryCall_roomName">
                {_t("%(name)s on hold", { name: secondCallRoom.name })}
            </span>
        </AccessibleButton>
    </span>;
}

export function CallViewHeader({
  callType,
  pipMode = false,
  callRoom = undefined,
  secondCallRoom = undefined,
  onPipMouseDown,
}: CallViewHeaderProps) {
    const callTypeText = callTypeTranslationByType[callType]();

    if (pipMode) {
        return <div className="mx_CallView_header" onMouseDown={onPipMouseDown}>
            <div className="mx_CallView_header_phoneIcon"></div>
            <span className="mx_CallView_header_callType">{callTypeText}</span>
            <CallControls pipMode={pipMode} callType={callType} />
        </div>;
    }
    return (<div
        className="mx_CallView_header"
    >
        <AccessibleButton onClick={() => onRoomAvatarClick(callRoom.roomId)}>
            <RoomAvatar room={callRoom} height={32} width={32} />
        </AccessibleButton>
        <div className="mx_CallView_header_callInfo">
            <div className="mx_CallView_header_roomName">{callRoom.name}</div>
            <div className="mx_CallView_header_callTypeSmall">
                {callTypeText}
                {secondCallRoom && <SecondaryCallInfo secondCallRoom={secondCallRoom} />}
            </div>
        </div>
        <CallControls pipMode={pipMode} callType={callType} />
    </div>
    );
}
