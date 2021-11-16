import os
import sys
import signal
import subprocess
import multiprocessing as mp
from jupyterlab_nextflow.database import Statuses, Instance, get_session


class LocalInvoker(object):

    def __init__(self, database_uri: str) -> None:
        self.processes = {}
        self.database_uri = database_uri
    
    def start(self, command: str, id: str) -> str:
        instance = mp.Process(
            target=self._start,
            args=(
                command,
                self.database_uri,
                id
            )
        )

        # Save the multiprocess to the process store
        self.processes[str(id)] = instance

        # Launch the instance
        instance.start()

        return id

    @staticmethod
    def _start(command, database_uri: str, id: str) -> None:
        # Get the invocation instance by id
        db = get_session(database_uri)
        invocation = db.query(Instance).get(id)

        # Update the invocation with the current pid
        invocation.pid = os.getpid()
        db.commit()

        # Invoke the given callable and update the status
        try:
            proc = subprocess.Popen([command], shell=True)
            invocation.status = Statuses.LAUNCHED
            db.commit()

            # Wait for the exit status
            ret = proc.wait()
            sys.exit(ret)

        # If we receive sigint, assume the process was
        # terminated intentionally and exit gracefully
        except KeyboardInterrupt:
            invocation.status = Statuses.TERMINATED
            db.commit()
            sys.exit(0)

        except SystemExit as e:
            # If we receive system exit of 0, assume the process
            # ended peacefully and exit gracefully.
            if not e.code:
                invocation.status = Statuses.COMPLETED_SUCCESSFULLY
                db.commit()
                sys.exit(0)

            # If we receive a non-zero system exit update the
            # status to reflect an error. Exit with code 1.
            invocation.status = Statuses.ENCOUNTERED_ERROR
            db.commit()
            sys.exit(1)

        # Handle all other exception classes in the event of
        # unhandled exceptions occurring within the callable.
        # Set the status to error and exit with code 1.
        except Exception as e:
            invocation.status = Statuses.ENCOUNTERED_ERROR
            db.commit()
            sys.exit(1)

    def stop(self, id: str) -> str:
        db = get_session(self.database_uri)
        invocation = db.query(Instance).get(id)
        proc = self.processes.get(invocation.id)

        if not invocation.status in ['LAUNCHED']:
            return invocation.status

        try:
            os.kill(int(invocation.pid), signal.SIGINT)
        except (OSError, KeyboardInterrupt, TypeError):
            pass

        if proc:
            proc.join()

        return invocation.status