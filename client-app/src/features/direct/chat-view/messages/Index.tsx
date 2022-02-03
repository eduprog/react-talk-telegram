import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../../../app/stores/store";
import MessageComponent from "./message-component/Index";
import ReplyIcon from "@mui/icons-material/Reply";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ForwardIcon from "@mui/icons-material/Forward";
import PushPinIcon from "@mui/icons-material/PushPin";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ScrollableFeed from "react-scrollable-feed";
import Menu from "@mui/material/Menu/Menu";
import MenuItem from "@mui/material/MenuItem/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon/ListItemIcon";
import ListItemText from "@mui/material/ListItemText/ListItemText";
import Paper from "@mui/material/Paper/Paper";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton/IconButton";
import Stack from "@mui/material/Stack/Stack";
import Typography from "@mui/material/Typography/Typography";
import { Message } from "../../../../app/models/chat";
import DateMessage from "./DateMessage";
import { toast } from "react-toastify";

export interface Props {
  selected: Message[];
  toggleSelected: (messsage: Message) => void;
}

export default observer(function Messages({selected, toggleSelected}: Props) {
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const messagesRef = useRef<(HTMLElement | null)[]>([]);
  const [selectedPin, setSelectedPin] = useState(0);

  const {
    directStore: { currentChat, replyMessage, setReplyMessage, getMessageIndexById, clearReply, getMessageById, addPin, removingPin, removePin },
    userStore: { user },
  } = useStore();

  const goToMessage = (id: number) => {
    const searchResult = getMessageIndexById(id);
    if(searchResult !== undefined) {
      messagesRef.current[searchResult]?.scrollIntoView(({ behavior: 'smooth', block: 'nearest', inline: 'start' }));
    }
  }

  useEffect(() => {
    if(!currentChat)
      return;
    switch(currentChat.type) {
      case 0:
        messagesRef.current = messagesRef.current.slice(0, currentChat.privateChat?.messages.length);
        break;
      case 1:
        messagesRef.current = messagesRef.current.slice(0, currentChat.groupChat?.messages.length);
        break;
      case 2:
        messagesRef.current = messagesRef.current.slice(0, currentChat.channelChat?.messages.length);
        break;
    }
  }, [currentChat]);

  useEffect(() => {
    if(!currentChat)
      return;
    setSelectedPin(currentChat.pins.length-1);
  }, [currentChat, currentChat?.pins.length])
 
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuMsg, setMenuMsg] = React.useState<null | Message>(null);
  const open = Boolean(anchorEl);
  
  const onRightClick = (e: React.MouseEvent<HTMLDivElement>, message: Message) => {
    e.preventDefault();
    setMenuLeft(e.clientX);
    setMenuTop(e.clientY);
    setMenuMsg(message);
    handleClick(e);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!currentChat) return null;

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        overflowY: "auto",
        flexDirection: "column-reverse",
      }}
    >
      {selected.length === 0 && replyMessage && (
        <Paper
          square
          sx={{
            height: "5.5rem",
            width: "100%",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <ReplyIcon
            className="mirror"
            style={{
              width: 30,
              height: 30,
              margin: "auto 0",
              marginLeft: "1rem",
              color: "#007FFF",
            }}
          />
          <div style={{ flex: 1 }}>
            <Stack
              direction="column"
              justifyContent="center"
              sx={{ marginLeft: "1.5rem", fontSize: "1rem", height: "100%" }}
            >
              <Typography
                fontSize="1.4rem"
                variant="h6"
                sx={{ color: "#007FFF" }}
              >
                {replyMessage.displayName}
              </Typography>
              <Typography fontSize="1.4rem">{replyMessage.body}</Typography>
            </Stack>
          </div>
          <IconButton style={{ width: 48, height: 48, margin: "auto 0" }} onClick={clearReply}>
            <CloseIcon />
          </IconButton>
        </Paper>
      )}
      <ScrollableFeed className="messages">
        {(currentChat?.type === 0 || currentChat?.type === -10) &&
          user &&
          currentChat.privateChat?.messages.map((message, i) => (
            <div
              className={`messages__message ${
                message.username === user.username && "messages__message--me"
              }`}
              key={i}
              ref={el => messagesRef.current[i] = el} 
            >
              {message.type === 1000 ? <DateMessage message={message} /> : 
              <MessageComponent onRightClick={(e) => onRightClick(e, message)} message={message} goToMessage={goToMessage} selected={selected} toggleSelected={toggleSelected}/>}
            </div>
          ))}
        {currentChat?.type === 1 &&
          user &&
          currentChat.groupChat?.messages.map((message, i) => (
            <div
              className={`messages__message ${
                message.username === user.username && "messages__message--me"
              }`}
              key={i}
              ref={el => messagesRef.current[i] = el} 
            >
              {message.type === 1000 ? <DateMessage message={message} /> : 
              <MessageComponent onRightClick={(e) => onRightClick(e, message)} message={message} goToMessage={goToMessage} selected={selected} toggleSelected={toggleSelected}/>}
            </div>
          ))}
        {currentChat?.type === 2 &&
          user &&
          currentChat.channelChat?.messages.map((message, i) => (
            <div
              className={`messages__message ${
                message.username === user.username && "messages__message--me"
              }`}
              key={i}
              ref={el => messagesRef.current[i] = el} 
            >
              {message.type === 1000 ? <DateMessage message={message} /> :
              <MessageComponent onRightClick={(e) => onRightClick(e, message)} message={message} goToMessage={goToMessage} selected={selected} toggleSelected={toggleSelected}/>}
            </div>
          ))}
      </ScrollableFeed>
      {selected.length === 0 && currentChat.pins.length > 0 && selectedPin >= 0 && selectedPin < currentChat.pins.length && <Paper
        square
        sx={{
          height: "5.5rem",
          width: "100%",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "row",
          zIndex: 1
        }}
        elevation={3}
      >
        <div style={{ flex: 1 }}>
          <Stack
            direction="column"
            justifyContent="center"
            sx={{ marginLeft: "1.5rem", fontSize: "1rem", height: "100%", cursor: 'pointer' }}
            onClick={() => {
              let newIndex = selectedPin -1;
              if(newIndex === -1) {
                newIndex = currentChat.pins.length - 1;
              }
              goToMessage(currentChat.pins[selectedPin].messageId);
              setSelectedPin(newIndex);
            }}
          >
            <Typography
              fontSize="1.4rem"
              variant="h6"
              sx={{ color: "#007FFF" }}
            >
              Pinned Message {selectedPin !== currentChat.pins.length-1 && "#" + (selectedPin+1).toString()}
            </Typography>
            <Typography fontSize="1.4rem">{getMessageById(currentChat.pins[selectedPin].messageId)?.body}</Typography>
          </Stack>
        </div>
        <IconButton style={{ width: 48, height: 48, margin: "auto 0" }}>
          <CloseIcon onClick={() => !removingPin && removePin(currentChat.id, currentChat.pins[selectedPin].id)} sx={{ opacity: removingPin ? 0.25 : 1 }}/>
        </IconButton>
      </Paper>}
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorReference="anchorPosition"
        anchorPosition={{ top: menuTop, left: menuLeft }}
      >
        <MenuItem onClick={() => setReplyMessage(menuMsg!)}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(menuMsg!.body);
          toast('Copied text to clipboard', {type: 'success'});
        }}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Forward</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => addPin(currentChat.id, menuMsg!.id, true)}>
          <ListItemIcon>
            <PushPinIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pin</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
});
