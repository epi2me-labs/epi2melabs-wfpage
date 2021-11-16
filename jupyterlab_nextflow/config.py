from traitlets.traitlets import Unicode
from traitlets.config import Configurable


class JupyterlabNextflowConfig(Configurable):
    """
    Allows configuration of the Jupyterlab_Nextflow launcher
    """
    port = Unicode(
        '9000', config=True,
        help="Sets the comms port for accessing labslauncher's api."
    )