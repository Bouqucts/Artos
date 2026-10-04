import type {
  AccountOption,
  RecurringExpense,
} from '@/features/quick/hooks/useRecurringExpenses';
import { MenuView } from '@expo/ui/community/menu';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  panHandlers: any;
  translateY: Animated.Value;
  onMenuAction: (action: 'add' | 'edit') => void;
  items: RecurringExpense[];
  accounts: AccountOption[];
  onAddTransaction: (
    item: RecurringExpense,
    accountId: string
  ) => void;
  onDelete: (id: string) => void;
  onEdit: (item: RecurringExpense) => void;
};

export function RecurringExpensesCard({
  panHandlers,
  translateY,
  onMenuAction,
  items,
  accounts,
  onAddTransaction,
  onDelete,
  onEdit,
}: Props) {
  const [editMode, setEditMode] = React.useState(false);
  const [orderedItems, setOrderedItems] = React.useState(items);

  // Android menu
  const [showHeaderMenu, setShowHeaderMenu] = React.useState(false);

  React.useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const moveItem = (id: string, direction: -1 | 1) => {
    setOrderedItems((current) => {
      const next = [...current];

      const index = next.findIndex(
        (row) => row.id === id
      );

      const target = index + direction;

      if (
        index < 0 ||
        target < 0 ||
        target >= next.length
      ) {
        return current;
      }

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      return next;
    });
  };

  /*
   * iOS:
   * Tetap menggunakan MenuView seperti kode original.
   *
   * Android:
   * Menggunakan Pressable + custom popup karena MenuView
   * adalah native component dan implementasinya berbeda.
   */

  const iosHeaderAction = editMode ? (
    <TouchableOpacity
      onPress={() => setEditMode(false)}
      hitSlop={10}
      accessibilityLabel="Finish editing"
    >
      <Feather
        name="check"
        size={25}
        color="#202a33"
      />
    </TouchableOpacity>
  ) : (
    <MenuView
      actions={[
        {
          id: 'add',
          title: 'Add',
          image: 'plus',
        },
        {
          id: 'edit',
          title: 'Edit',
          image: 'pencil',
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'edit') {
          setEditMode(true);
        }

        onMenuAction(
          nativeEvent.event as 'add' | 'edit'
        );
      }}
    >
      <TouchableOpacity
        hitSlop={10}
        accessibilityLabel="Recurring expense menu"
      >
        <Feather
          name="menu"
          size={25}
          color="#202a33"
        />
      </TouchableOpacity>
    </MenuView>
  );

  const androidHeaderAction = editMode ? (
    <TouchableOpacity
      onPress={() => {
        setEditMode(false);
        setShowHeaderMenu(false);
      }}
      hitSlop={10}
      accessibilityLabel="Finish editing"
    >
      <Feather
        name="check"
        size={25}
        color="#202a33"
      />
    </TouchableOpacity>
  ) : (
    <View>
      <Pressable
        onPress={() =>
          setShowHeaderMenu((value) => !value)
        }
        hitSlop={10}
        accessibilityLabel="Recurring expense menu"
      >
        <Feather
          name="menu"
          size={25}
          color="#202a33"
        />
      </Pressable>

      {showHeaderMenu && (
        <View style={styles.androidHeaderMenu}>
          <Pressable
            style={styles.androidMenuItem}
            onPress={() => {
              setShowHeaderMenu(false);
              onMenuAction('add');
            }}
          >
            <Feather
              name="plus"
              size={18}
              color="#30383e"
            />

            <Text style={styles.androidMenuText}>
              Add
            </Text>
          </Pressable>

          <Pressable
            style={styles.androidMenuItem}
            onPress={() => {
              setShowHeaderMenu(false);
              setEditMode(true);
              onMenuAction('edit');
            }}
          >
            <Feather
              name="edit-2"
              size={18}
              color="#30383e"
            />

            <Text style={styles.androidMenuText}>
              Edit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const headerAction =
    Platform.OS === 'android'
      ? androidHeaderAction
      : iosHeaderAction;

  return (
    <Animated.View
      {...(!editMode ? panHandlers : {})}
      style={[
        styles.card,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.handle} />

      <View style={styles.heading}>
        <Text style={styles.title}>
          Recurring Expenses
        </Text>

        {headerAction}
      </View>

      {orderedItems.length === 0 ? (
        <View style={styles.empty}>
          <Feather
            name="repeat"
            size={32}
            color="#c5cdd3"
          />

          <Text style={styles.emptyText}>
            No recurring expenses yet
          </Text>
        </View>
      ) : (
        <View style={styles.rows}>
          {orderedItems.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              accounts={accounts}
              editMode={editMode}
              onAdd={(accountId) =>
                onAddTransaction(
                  item,
                  accountId
                )
              }
              onEdit={() => onEdit(item)}
              onDelete={() =>
                Alert.alert(
                  'Delete recurring expense?',
                  `Delete ${item.name}?`,
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        onDelete(item.id),
                    },
                  ]
                )
              }
              onMoveUp={() =>
                moveItem(item.id, -1)
              }
              onMoveDown={() =>
                moveItem(item.id, 1)
              }
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function RecurringRow({
  item,
  accounts,
  editMode,
  onAdd,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: RecurringExpense;
  accounts: AccountOption[];
  editMode: boolean;
  onAdd: (accountId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const x = React.useRef(
    new Animated.Value(0)
  ).current;

  const scale = React.useRef(
    new Animated.Value(1)
  ).current;

  const dragY = React.useRef(
    new Animated.Value(0)
  ).current;

  const [reorderActive, setReorderActive] =
    React.useState(false);

  const [showDelete, setShowDelete] =
    React.useState(false);

  const [showAccounts, setShowAccounts] =
    React.useState(false);

  const dragStep = React.useRef(0);

  const holdTimer =
    React.useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const startHold = () => {
    if (!editMode) return;

    holdTimer.current = setTimeout(() => {
      setShowDelete(false);

      Animated.spring(x, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }).start();

      setReorderActive(true);

      Animated.spring(scale, {
        toValue: 1.035,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }).start();
    }, 260);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          editMode,

        onPanResponderGrant: () =>
          startHold(),

        onPanResponderMove: (_, g) => {
          if (!editMode) return;

          if (reorderActive) {
            const nextStep = Math.trunc(
              g.dy / 49
            );

            const delta =
              nextStep - dragStep.current;

            if (delta < 0) {
              for (
                let i = 0;
                i < -delta;
                i += 1
              ) {
                onMoveUp();
              }
            }

            if (delta > 0) {
              for (
                let i = 0;
                i < delta;
                i += 1
              ) {
                onMoveDown();
              }
            }

            dragStep.current = nextStep;

            dragY.setValue(
              g.dy - nextStep * 49
            );
          } else if (g.dx < -3) {
            setShowDelete(true);
            x.setValue(-82);
          } else if (g.dx > 3) {
            setShowDelete(false);
            x.setValue(0);
          }
        },

        onPanResponderRelease: (_, g) => {
          cancelHold();

          if (reorderActive) {
            setReorderActive(false);
            setShowDelete(false);
            dragStep.current = 0;

            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 18,
              stiffness: 260,
            }).start();

            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              damping: 18,
              stiffness: 260,
            }).start();
          } else {
            const open = g.dx < -3;

            setShowDelete(open);

            Animated.spring(x, {
              toValue: open ? -82 : 0,
              useNativeDriver: true,
              damping: 18,
              stiffness: 260,
            }).start();

            if (
              Math.abs(g.dx) < 8 &&
              Math.abs(g.dy) < 8
            ) {
              onEdit();
            }
          }
        },

        onPanResponderTerminate: () => {
          cancelHold();

          setReorderActive(false);
          setShowDelete(false);

          dragStep.current = 0;

          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        },

        // Gesture callbacks intentionally own the whole edit row
        // so whitespace is draggable too.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [
      editMode,
      reorderActive,
      onMoveUp,
      onMoveDown,
      onEdit,
      x,
      scale,
      dragY,
    ]
  );

  const accountActions = accounts.map(
    (account) => ({
      id: account.id,
      title: account.name,
      image: 'creditcard' as const,
    })
  );

  /*
   * iOS:
   * Tetap menggunakan MenuView original.
   *
   * Android:
   * Menggunakan Pressable + custom account popup.
   */

  const iosAddButton = accounts.length ? (
    <MenuView
      title="Choose account"
      shouldOpenOnLongPress={false}
      actions={accountActions}
      onPressAction={({ nativeEvent }) =>
        onAdd(nativeEvent.event)
      }
    >
      <Pressable
        style={styles.add}
        accessibilityLabel={`Add ${item.name}`}
      >
        <Feather
          name="plus"
          size={19}
          color="#2f84c6"
        />
      </Pressable>
    </MenuView>
  ) : (
    <Pressable
      style={styles.add}
      onPress={() => onAdd('')}
    >
      <Feather
        name="plus"
        size={19}
        color="#2f84c6"
      />
    </Pressable>
  );

  const androidAddButton = (
    <View>
      <Pressable
        style={styles.add}
        onPress={() => {
          if (accounts.length === 0) {
            onAdd('');
            return;
          }

          if (accounts.length === 1) {
            onAdd(accounts[0].id);
            return;
          }

          setShowAccounts(
            (value) => !value
          );
        }}
        accessibilityLabel={`Add ${item.name}`}
      >
        <Feather
          name="plus"
          size={19}
          color="#2f84c6"
        />
      </Pressable>

      {showAccounts && (
        <View style={styles.accountMenu}>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              style={styles.accountMenuItem}
              onPress={() => {
                setShowAccounts(false);
                onAdd(account.id);
              }}
            >
              <Feather
                name="credit-card"
                size={17}
                color="#30383e"
              />

              <Text
                style={styles.accountMenuText}
                numberOfLines={1}
              >
                {account.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const addButton =
    Platform.OS === 'android'
      ? androidAddButton
      : iosAddButton;

  return (
    <View style={styles.rowShell}>
      <View
        style={[
          styles.deleteBack,
          {
            opacity: showDelete ? 1 : 0,
          },
        ]}
      >
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <Feather
            name="trash-2"
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>

      <Animated.View
        {...responder.panHandlers}
        style={[
          styles.row,
          {
            transform: [
              { translateX: x },
              { translateY: dragY },
              { scale },
            ],
          },
        ]}
      >
        <View style={styles.rowTap}>
          <Text style={styles.name}>
            {item.name}
          </Text>

          <Text style={styles.amount}>
            NT$ {item.amount.toLocaleString()}
          </Text>

          {editMode ? (
            <Feather
              name="menu"
              size={21}
              color="#697780"
            />
          ) : (
            addButton
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 328,
    left: 20,
    right: 20,
    height: 800,
    zIndex: 1,
    overflow: 'hidden',
    borderRadius: 31,
    borderWidth: 4,
    borderColor: '#d9dcdd',
    paddingHorizontal: 28,
    backgroundColor: '#fff',
  },

  handle: {
    height: 3,
    width: 102,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#d9dddf',
    marginTop: 12,
    marginBottom: 12,
  },

  heading: {
    minHeight: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 20,
  },

  title: {
    color: '#30383e',
    fontSize: 20,
    fontWeight: '500',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
  },

  emptyText: {
    color: '#a2abb1',
    fontSize: 15,
  },

  rows: {
    marginTop: 4,
  },

  rowShell: {
    height: 49,
    position: 'relative',
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: '#364149',
  },

  deleteBack: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff575b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3,
  },

  row: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
  },

  rowTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  name: {
    flex: 1,
    color: '#3a4247',
    fontSize: 18,
  },

  amount: {
    color: '#3a4247',
    fontSize: 17,
    marginRight: 14,
  },

  add: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#3389c7',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // =========================
  // ANDROID HEADER MENU
  // =========================

  androidHeaderMenu: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 999,
  },

  androidMenuItem: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },

  androidMenuText: {
    color: '#30383e',
    fontSize: 15,
  },

  // =========================
  // ANDROID ACCOUNT MENU
  // =========================

  accountMenu: {
    position: 'absolute',
    right: 0,
    top: 38,
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 999,
  },

  accountMenuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },

  accountMenuText: {
    flex: 1,
    color: '#30383e',
    fontSize: 14,
  },
});