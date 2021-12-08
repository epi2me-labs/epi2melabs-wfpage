from traitlets.traitlets import Unicode, Bool
from traitlets.config import Configurable


class Epi2melabsWFPage(Configurable):
    """
    Allows configuration of the epi2melabs_wfpage launcher
    """
    remote = Bool(
        True, config=True,
        help="Launch wf_page in remote execution mode via labslauncher."
    )

    ip = Unicode(
        '0.0.0.0', config=True,
        help="Sets the host name for accessing labslauncher's api."
    )

    port = Unicode(
        '9000', config=True,
        help="Sets the comms port for accessing labslauncher's api."
    )