class DraggableAssignBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      leftOffset: 0,
      topOffset: 0,
      left: 0,
      top: 0,
      dragging: false
    };
    this.handleDrag = this.handleDrag.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.setCurrentTarget = this.setCurrentTarget.bind(this);
    this.generateEnterLeaveEvents = this.generateEnterLeaveEvents.bind(this);
    this.dragElem = null;
    this.currentTarget = null;
    this.prevTarget = null;
    this.dropTarget = [];
  }

  componentDidMount() {
    for (const elem of this.dropTarget) {
      elem.addEventListener("onTouchDragEnter", this.handleDragEnter, false);
      elem.addEventListener("onTouchDragLeave", this.handleDragLeave, false);
      elem.addEventListener("onTouchDrop", this.handleDrop, false);
    }
  }

  componentWillUnmount() {
    for (const elem of this.dropTarget) {
      elem.removeEventListener("onTouchDragEnter", this.handleDragEnter, false);
      elem.removeEventListener("onTouchDragLeave", this.handleDragLeave, false);
      elem.removeEventListener("onTouchDrop", this.handleDrop, false);
    }
  }

  handleDrag(event, player) {
    event.dataTransfer.setData("player", player);
  }

  handleTouchStart(event) {
    const rect = event.target.getBoundingClientRect();
    this.setState({
      leftOffset: rect.left - event.targetTouches[0].clientX,
      topOffset: rect.top - event.targetTouches[0].clientY,
      left: rect.left,
      top: rect.top,
      dragging: true
    });
    // Prepare the draggable icon
    this.dragElem.dataset.player = event.target.dataset.player;
    this.dragElem.classList.add(event.target.dataset.icon);
  }

  handleTouchMove(event) {
    const x = event.targetTouches[0].clientX;
    const y = event.targetTouches[0].clientY;

    const stateChanges = { dragging: true };
    stateChanges.left = this.state.leftOffset + x;
    stateChanges.top = this.state.topOffset + y;

    this.setState(stateChanges);
    this.generateEnterLeaveEvents(x, y);
  }

  handleTouchEnd(event) {
    const x = event.changedTouches[0].clientX;
    const y = event.changedTouches[0].clientY;

    this.setState({ dragging: false });
    this.generateDropEvent(x, y);

    // Empty the draggable icon
    this.dragElem.dataset.player = "";
    this.dragElem.classList.remove("fa-user-tie");
    this.dragElem.classList.remove("fa-robot");
  }

  handleDragEnter(event) {
    event.target.classList.add("hover");
    event.preventDefault();
  }

  handleDragLeave(event) {
    event.target.classList.remove("hover");
    event.preventDefault();
  }

  handleDrop(event, color) {
    event.target.classList.remove("hover");
    let player;
    if (event.type && event.type === "onTouchDrop") {
      player = event.detail["player"];
      color = event.detail["color"];
    } else {
      player = event.dataTransfer.getData("player");
    }
    this.props.assignPlayer(player, color);
  }

  setCurrentTarget = (x, y) => {
    this.dragElem.style.zIndex = -1;
    const target = document.elementFromPoint(x, y) || document.body;
    this.dragElem.style.zIndex = 1;
    // prevent it from selecting itself as the target
    this.currentTarget = this.dragElem.contains(target)
      ? document.body
      : target;
  };

  generateEnterLeaveEvents = (x, y) => {
    this.setCurrentTarget(x, y);
    if (this.currentTarget !== this.prevTarget) {
      if (this.prevTarget) {
        this.prevTarget.dispatchEvent(new CustomEvent("onTouchDragLeave"));
      }
      if (this.currentTarget) {
        this.currentTarget.dispatchEvent(new CustomEvent("onTouchDragEnter"));
      }
    }
    this.prevTarget = this.currentTarget;
  };

  generateDropEvent = (x, y) => {
    // generate a drop event in whatever we're currently dragging over
    this.setCurrentTarget(x, y);
    this.currentTarget.dispatchEvent(
      new CustomEvent("onTouchDrop", {
        detail: {
          player: this.dragElem.dataset.player,
          color: this.currentTarget.dataset.color
        }
      })
    );
  };

  render() {
    // Assigned players map
    const assigned_players_map = {};
    let hasHumanPlayer = false;
    for (const player of this.props.game.players) {
      assigned_players_map[player.color] = player.type;
      hasHumanPlayer = hasHumanPlayer || player.type === "HUMAN";
    }

    const drag_items = [];
    drag_items.push(
      <div
        key="drag-item-human"
        className="drag-item icon-cell fad fa-user-tie"
        data-player="HUMAN"
        data-icon="fa-user-tie"
        draggable="true"
        onDragStart={event => {
          event.target.classList.add("drag");
          this.handleDrag(event, "HUMAN");
        }}
        onDragEnd={event => {
          event.target.classList.remove("drag");
        }}
        onTouchStart={event => {
          event.target.classList.add("drag");
          this.handleTouchStart(event);
        }}
        onTouchMove={event => {
          event.target.classList.add("drag");
          this.handleTouchMove(event);
        }}
        onTouchEnd={event => {
          event.target.classList.remove("drag");
          this.handleTouchEnd(event);
        }}
      ></div>
    );
    if (this.props.game.players.length > 0 && hasHumanPlayer) {
      drag_items.push(
        <div key="drag-item-partition" className="drag-item-partition"></div>
      );

      drag_items.push(
        <div
          key="drag-item-bot"
          className="drag-item icon-cell fad fa-robot"
          data-player="BOT"
          data-icon="fa-robot"
          draggable="true"
          onDragStart={event => {
            event.target.classList.add("drag");
            this.handleDrag(event, "BOT");
          }}
          onDragEnd={event => {
            event.target.classList.remove("drag");
          }}
          onTouchStart={event => {
            event.target.classList.add("drag");
            this.handleTouchStart(event);
          }}
          onTouchMove={event => {
            event.target.classList.add("drag");
            this.handleTouchMove(event);
          }}
          onTouchEnd={event => {
            event.target.classList.remove("drag");
            this.handleTouchEnd(event);
          }}
        ></div>
      );
    }

    const drop_items = [];
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const assignedPlayer = [];
      let droppable = false;

      const dropclass = [];
      dropclass.push("drop-item");
      dropclass.push("cell-" + color);

      if (assigned_players_map[color]) {
        const assignedclass = [];
        assignedclass.push("assigned-item");
        assignedclass.push("player-icon-" + color);
        assignedclass.push("far");
        if (assigned_players_map[color] === "HUMAN") {
          assignedclass.push("fa-user");
        }
        if (assigned_players_map[color] === "BOT") {
          assignedclass.push("fa-robot");
        }
        assignedPlayer.push(
          <div
            key={"drop-item-assigned-" + color}
            className={assignedclass.join(" ")}
          ></div>
        );
        assignedPlayer.push(
          <div
            key={"drop-item-undo-" + color}
            className="undo icon-cell far fa-minus-circle"
            onClick={() => this.props.unAssignPlayer(color)}
          ></div>
        );
      } else {
        dropclass.push("droppable");
        droppable = true;
      }

      drop_items.push(
        <div
          key={"drop-target-" + color}
          data-color={color}
          ref={elem => (this.dropTarget[i] = elem)}
          className={dropclass.join(" ")}
          onDragOver={droppable ? e => this.handleDragEnter(e) : undefined}
          onDragLeave={droppable ? e => this.handleDragLeave(e) : undefined}
          onDrop={e => this.handleDrop(e, color)}
        >
          {assignedPlayer}
        </div>
      );
    }

    const contents = [];
    // Show draggable section till all players not assigned
    if (this.props.game.players.length < 4) {
      contents.push(
        <div key="dragzone" className="dragzone">
          {drag_items}
        </div>
      );
      contents.push(
        <div key="direction-zone" className="direction-zone">
          <i className="icon-cell far fa-arrow-alt-down updown"></i>
        </div>
      );
    }
    contents.push(
      <div key="dropzone" className="dropzone">
        {drop_items}
      </div>
    );

    // Show next button only after two players are assigned
    if (this.props.game.players.length > 1 && hasHumanPlayer) {
      contents.push(
        <div
          key="next-zone"
          className="next-zone"
          onClick={() => this.props.startClickHandler()}
        >
          <i className="icon-cell fas fa-chevron-right"></i>
        </div>
      );
    }

    return (
      <div className="assignment-box">
        <div className="contents">{contents}</div>
        <div
          className="draggable-cell fad"
          style={{
            position: "fixed",
            left: this.state.left,
            top: this.state.top,
            display: this.state.dragging ? "block" : "none"
          }}
          ref={elem => (this.dragElem = elem)}
          data-player="HUMAN"
        ></div>
      </div>
    );
  }
}
